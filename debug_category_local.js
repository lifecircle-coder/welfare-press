const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to read .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf8');
        supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
        supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
    }
} catch (e) {
    console.error('Error reading env:', e);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuery() {
    const category = '건강·의료';
    const prefix = '건강';
    
    console.log(`Checking articles for Category: [${category}], Prefix: [${prefix}]`);

    // 1. Raw check of some articles in this category
    const { data: rawArticles, error: rawError } = await supabase
        .from('articles')
        .select('id, title, category, prefix, category_list')
        .eq('category', category)
        .limit(5);

    if (rawError) {
        console.error('Raw query error:', rawError);
    } else {
        console.log('\n--- Raw articles in "건강·의료" ---');
        rawArticles.forEach(a => {
            console.log(`ID: ${a.id}, Title: ${a.title}`);
            console.log(`  Category: "${a.category}", Prefix: "${a.prefix}"`);
            console.log(`  Category List:`, JSON.stringify(a.category_list));
        });
    }

    // 2. Test the specific OR query that failed
    console.log('\n--- Testing the OR query ---');
    const orQuery = `and(category.eq."${category}",prefix.eq."${prefix}"),category_list.cs.[{"category":"${category}","prefix":"${prefix}"}]`;
    console.log(`OR Filter: ${orQuery}`);
    
    const { data: filtered, error: filterError } = await supabase
        .from('articles')
        .select('id, title')
        .eq('status', 'published')
        .or(orQuery);

    if (filterError) {
        console.error('Filter query error:', filterError);
    } else {
        console.log(`Results found: ${filtered?.length || 0}`);
        filtered?.forEach(a => console.log(` - ${a.title}`));
    }
}

debugQuery();
