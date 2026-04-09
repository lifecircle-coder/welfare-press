const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, prefix, category_list')
        .eq('id', 'b8063d27-3d4f-48ea-9090-b337d920de6d')
        .single();

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- Article Data ---');
    console.log('Category:', JSON.stringify(data.category));
    console.log('Prefix:', JSON.stringify(data.prefix));
    console.log('Category List:', JSON.stringify(data.category_list, null, 2));
    
    // Test simple filters one by one
    console.log('\n--- Testing Filters ---');
    
    const test1 = await supabase.from('articles').select('id').eq('category', data.category).eq('prefix', data.prefix).limit(1);
    console.log('eq(category) and eq(prefix):', test1.data?.length > 0 ? 'Success' : 'Fail', test1.error?.message || '');

    const test2 = await supabase.from('articles').select('id').or(`category.eq."${data.category}",prefix.eq."${data.prefix}"`).limit(1);
    console.log('or(category.eq, prefix.eq):', test2.data?.length > 0 ? 'Success' : 'Fail', test2.error?.message || '');

    const jsonStr = JSON.stringify([{ "category": data.category, "prefix": data.prefix }]);
    const test3 = await supabase.from('articles').select('id').or(`category_list.cs.${jsonStr}`).limit(1);
    console.log('or(category_list.cs.[JSON]):', test3.data?.length > 0 ? 'Success' : 'Fail', test3.error?.message || '');
}

check();
