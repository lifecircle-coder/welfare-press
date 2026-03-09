
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
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDataSize() {
    console.log('--- Database Field Size Inspection ---');
    console.log(`Url: ${supabaseUrl}`);

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, summary, thumbnail')
        .limit(10);

    if (error) {
        console.error('Error fetching articles:', error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log('No articles found.');
        return;
    }

    articles.forEach(article => {
        const titleSize = Buffer.byteLength(article.title || '', 'utf8');
        const summarySize = Buffer.byteLength(article.summary || '', 'utf8');
        const thumbnailSize = Buffer.byteLength(article.thumbnail || '', 'utf8');

        console.log(`Article: ${article.title}`);
        console.log(`- Summary Size: ${(summarySize / 1024).toFixed(2)} KB`);
        console.log(`- Thumbnail Size: ${(thumbnailSize / 1024 / 1024).toFixed(2)} MB`);

        if (thumbnailSize > 1024 * 1024) {
            console.warn(`  🚨 CRITICAL: Massive thumbnail detected! (${(thumbnailSize / 1024 / 1024).toFixed(2)} MB)`);
            if (article.thumbnail && article.thumbnail.length > 100) {
                console.log(`  Preview: ${article.thumbnail.substring(0, 50)}...`);
            }
        }
        console.log('---');
    });
}

inspectDataSize();
