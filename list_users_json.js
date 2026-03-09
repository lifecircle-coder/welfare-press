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

async function listUsersVerbose() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        fs.writeFileSync('users_result.json', JSON.stringify({ error: error.message }));
        return;
    }

    const result = users.map(u => ({
        id: u.id,
        email: u.email,
        metadata: u.user_metadata,
        created_at: u.created_at
    }));

    fs.writeFileSync('users_result.json', JSON.stringify(result, null, 2), 'utf8');
    console.log('Saved users to users_result.json');
}

listUsersVerbose();
