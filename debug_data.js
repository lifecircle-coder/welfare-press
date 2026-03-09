const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Checking Articles & Thumbnails ---');
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, category, thumbnail')
        .limit(20);

    if (error) console.error(error);
    else {
        articles.forEach(a => {
            console.log(`[${a.category}] ${a.title} -> Thumbnail: ${a.thumbnail ? (a.thumbnail.substring(0, 50) + '...') : 'NULL'}`);
        });
    }

    console.log('\n--- Checking Users ---');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*');

    if (userError) console.error(userError);
    else {
        console.log(`Found ${users.length} users:`, users);
    }
}

checkData();
