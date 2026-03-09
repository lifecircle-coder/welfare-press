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

const usersToRestore = [
    {
        "id": "15e963ed-fdb3-4115-8672-bfb439751559",
        "email": "info.00677@gmail.com",
        "name": "이어사리설",
        "role": "user",
        "grade": "Lv.1",
        "specialty": "일반",
        "join_date": "2026-03-06T01:06:32.980929Z"
    },
    {
        "id": "bafa2a7c-49d4-4a43-a5e9-4e8e196cd884",
        "email": "press1@welfare-press.admin",
        "name": "김정호",
        "role": "reporter",
        "grade": "Lv.1",
        "specialty": "일반",
        "join_date": "2026-03-05T08:25:47.824917Z"
    },
    {
        "id": "ecda9c96-59b2-426c-96be-50f319e1e070",
        "email": "press@welfare-press.admin",
        "name": "이철민",
        "role": "reporter",
        "grade": "Lv.1",
        "specialty": "일반",
        "join_date": "2026-03-05T08:01:54.665369Z"
    },
    {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "master@welfare-press.admin",
        "name": "최고관리자",
        "role": "admin",
        "grade": "Lv.99",
        "specialty": "전체",
        "join_date": "2026-03-05T07:14:30.664046Z"
    }
];

async function restore() {
    console.log('--- RESTORING SPECIFIC USERS ---');
    for (const u of usersToRestore) {
        console.log(`Restoring: ${u.email} (${u.name}) as ${u.role}`);
        const { error } = await supabase
            .from('users')
            .upsert({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                grade: u.grade,
                specialty: u.specialty,
                join_date: u.join_date
            });

        if (error) console.error(`Error restoring ${u.email}:`, error);
        else console.log(`Restored ${u.email} successfully.`);
    }
}

restore();
