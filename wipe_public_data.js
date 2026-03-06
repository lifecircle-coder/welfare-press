const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvocjgtnsjdzonhyzbic.supabase.co';
const supabaseKey = 'sb_publishable_nGMtxy8jkN0w6fnDVBxzhw_cq6ZV4KZ'; // ANON KEY
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipePublicData() {
    console.log('--- 데이터베이스 대청소 시작 (Public Tables) ---');

    // 1. 기사 삭제 (UUID id)
    const { error: err1 } = await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.error('Articles 삭제 실패:', err1.message);
    else console.log('✅ 기사 데이터 모두 삭제 완료');

    // 2. 문의 삭제 (int8 id or UUID)
    // Try range delete if id is numeric or neq for UUID
    const { error: err2 } = await supabase.from('inquiries').delete().neq('title', 'RESERVED_TITLE_ONLY');
    if (err2) console.error('Inquiries 삭제 실패:', err2.message);
    else console.log('✅ 문의 데이터 모두 삭제 완료');

    // 3. 댓글 삭제
    const { error: err3 } = await supabase.from('comments').delete().neq('author', 'RESERVED_AUTHOR_ONLY');
    if (err3) console.error('Comments 삭제 실패:', err3.message);
    else console.log('✅ 댓글 데이터 모두 삭제 완료');

    // 4. 회원 삭제 (admin 제외)
    const { error: err4 } = await supabase.from('users').delete().neq('role', 'admin');
    if (err4) console.error('Users 삭제 실패:', err4.message);
    else console.log('✅ 일반 회원/기자 데이터 모두 삭제 완료');

    console.log('--- 청소 완료 ---');
    process.exit(0);
}

wipePublicData();
