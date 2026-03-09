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

async function restoreUsers() {
    console.log('--- RESTORING USERS ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    for (const u of users) {
        let role = u.user_metadata?.role || 'user';
        let name = u.user_metadata?.full_name || u.user_metadata?.name || '회원';
        let specialty = u.user_metadata?.specialty || (role === 'admin' ? '전체' : '일반');
        let grade = u.user_metadata?.grade || (role === 'admin' ? 'Lv.99' : 'Lv.1');

        // Master account override
        if (u.id === '00000000-0000-0000-0000-000000000001') {
            role = 'admin';
            name = '최고관리자';
            grade = 'Lv.99';
            specialty = '전체';
        }

        console.log(`Restoring: ID=${u.id}, Email=${u.email}, Role=${role}, Name=${name}`);

        const { error: insertError } = await supabase
            .from('users')
            .upsert({
                id: u.id,
                email: u.email,
                name: name,
                role: role,
                grade: grade,
                specialty: specialty,
                join_date: u.created_at
            });

        if (insertError) console.error(`Failed to restore ${u.email}:`, insertError);
    }
}

restoreUsers();
