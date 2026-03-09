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

async function verify() {
    console.log('--- Final Thumbnail Verification ---');
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, category, thumbnail')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const categories = ['건강·의료', '임신·육아', '일자리·취업', '생활·안전', '주거·금융'];
    categories.forEach(cat => {
        const item = articles.find(a => a.category === cat);
        if (item) {
            console.log(`[${cat}] -> Thumbnail: ${item.thumbnail ? 'OK' : 'MISSING'} (${item.thumbnail ? item.thumbnail.substring(0, 40) : 'N/A'})`);
        } else {
            console.log(`[${cat}] -> No articles found.`);
        }
    });

    const { data: users } = await supabase.from('users').select('count');
    console.log(`\nUsers in public.users: ${users ? users.length : 0}`);
}

verify();
