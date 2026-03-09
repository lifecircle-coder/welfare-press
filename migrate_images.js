
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Manually read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
    console.log('--- Starting Image Migration (Revised) ---');

    // 1. Fetch all articles with base64 thumbnails
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, thumbnail')
        .filter('thumbnail', 'ilike', 'data:image/%');

    if (error) {
        console.error('Error fetching articles:', error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log('No base64 thumbnails found.');
        return;
    }

    // Try to use partnership_files bucket which likely exists
    const bucketName = 'partnership_files';

    for (const article of articles) {
        try {
            const matches = article.thumbnail.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (!matches) continue;

            const ext = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `thumb-${article.id}.${ext}`;
            const filePath = `articles/${fileName}`;

            console.log(`Uploading: ${article.title}`);
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, buffer, { contentType: `image/${ext}`, upsert: true });

            if (uploadError) {
                console.error(`- Upload failed for ${bucketName}: ${uploadError.message}`);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            await supabase.from('articles').update({ thumbnail: publicUrl }).eq('id', article.id);
            console.log(`- Success! URL: ${publicUrl}`);

        } catch (err) {
            console.error(`- Error article ${article.id}:`, err.message);
        }
    }
    console.log('--- Finished ---');
}
migrateImages();
