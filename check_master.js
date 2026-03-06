require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkMaster() {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'admin');
    console.log(data);
}
checkMaster();
