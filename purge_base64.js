
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

async function purgeBase64() {
    console.log('--- Purging Base64 Thumbnails to Unblock Build ---');

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, category, thumbnail')
        .filter('thumbnail', 'ilike', 'data:image/%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log('No base64 thumbnails found.');
        return;
    }

    console.log(`Cleaning ${articles.length} articles...`);

    for (const article of articles) {
        // Replace with null so the UI uses its built-in fallback colored box
        const { error: updateError } = await supabase
            .from('articles')
            .update({ thumbnail: null }) // Setting to null uses the fallback UI
            .eq('id', article.id);

        if (updateError) {
            console.error(`- Failed for ${article.title}: ${updateError.message}`);
        } else {
            console.log(`- Cleaned: ${article.title}`);
        }
    }
    console.log('--- Finished. Build should now pass. ---');
}
purgeBase64();
