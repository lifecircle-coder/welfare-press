const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearArticles() {
    try {
        console.log('Clearing all articles...');
        const { error } = await supabase
            .from('articles')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Valid UUID structure

        if (error) {
            console.error('Error deleting articles:', error);
        } else {
            console.log('Successfully cleared all existing test articles.');
        }
    } catch (e) {
        console.error('Connection error:', e);
    }
}

clearArticles();
