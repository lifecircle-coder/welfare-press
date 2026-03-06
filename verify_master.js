const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경변수 읽기
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const loginId = 'master';
    const password = 'dldjtkfl@2026';
    const email = `${loginId}@welfare-press.admin`;

    console.log(`[테스트 시작] 아이디: ${loginId}, 매핑 이메일: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('[오류] 로그인 실패:', error.message);
        return;
    }

    console.log('[성공] 로그인 성공! 세션 생성됨.');
    console.log('User ID:', data.user.id);
    console.log('User Email:', data.user.email);
    console.log('User Metadata:', data.user.user_metadata);

    // public.users 테이블 확인
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (userError) {
        console.error('[오류] public.users 조회 실패:', userError.message);
    } else {
        console.log('[성공] public.users 정보 확인됨:', userData.name, userData.role);
    }
}

testLogin();
