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

async function listAllUsers() {
    console.log('--- Listing AUTH.USERS ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) console.error('Auth error:', authError);
    else {
        users.forEach(u => {
            console.log(`Auth User: ID=${u.id}, Email=${u.email}, Metadata=${JSON.stringify(u.user_metadata)}`);
        });
    }

    console.log('\n--- Listing PUBLIC.USERS ---');
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*');
    if (publicError) console.error('Public error:', publicError);
    else {
        publicUsers.forEach(u => {
            console.log(`Public User: ID=${u.id}, Email=${u.email}, Role=${u.role}, Name=${u.name}`);
        });
    }
}

listAllUsers();
