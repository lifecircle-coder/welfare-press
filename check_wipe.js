const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvocjgtnsjdzonhyzbic.supabase.co';
const supabaseKey = 'sb_publishable_nGMtxy8jkN0w6fnDVBxzhw_cq6ZV4KZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: articles } = await supabase.from('articles').select('id');
    const { data: users } = await supabase.from('users').select('name, role');
    const { data: inquiries } = await supabase.from('inquiries').select('id');

    console.log('--- 데이터베이스 상태 확인 ---');
    console.log(`Articles 남은 개수: ${articles?.length || 0}`);
    console.log(`Users (Admin 제외) 남은 개수: ${users?.filter(u => u.role !== 'admin').length || 0}`);
    console.log(`Inquiries 남은 개수: ${inquiries?.length || 0}`);

    if (users) {
        console.log('현재 Users 목록:', users);
    }

    process.exit(0);
}

checkData();
