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

async function deleteUsers() {
    console.log('--- Deleting Users for Clean Setup ---');
    const { error } = await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except maybe a system one if it exists, or just all

    if (error) console.error('Error deleting users:', error);
    else console.log('Successfully deleted all users from public.users table.');

    // Note: We cannot easily delete from auth.users via client unless we use admin API, 
    // but the user mostly cared about the registered state in the DB.
}

deleteUsers();
