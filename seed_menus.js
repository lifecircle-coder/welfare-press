const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMenus() {
    const defaultMenus = [
        { name: '일자리·취업', sort_order: 1, is_visible: true },
        { name: '주거·금융', sort_order: 2, is_visible: true },
        { name: '건강·의료', sort_order: 3, is_visible: true },
        { name: '생활·안전', sort_order: 4, is_visible: true },
        { name: '임신·육아', sort_order: 5, is_visible: true },
    ];

    console.log('Seeding menus...');
    
    // First, clear existing menus just in case
    await supabase.from('menus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { data, error } = await supabase
        .from('menus')
        .insert(defaultMenus)
        .select();

    if (error) {
        console.error('Error inserting menus:', error);
    } else {
        console.log('Successfully inserted menus:', data);
    }
}

seedMenus();
