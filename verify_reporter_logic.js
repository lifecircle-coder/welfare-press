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

async function verifyReporterFlow() {
    const reporterId = 'test_qa_reporter';
    const password = 'temp_password_123';
    const email = `${reporterId}@welfare-press.admin`;

    console.log(`[1단계] 기자 가입 테스트 ID: ${reporterId}`);

    // 기존 유저가 있다면 삭제 (테스트 환경)
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
        console.log('기존 테스트 계정 발견, 무시하고 진행(또는 직접 삭제 권장)');
    }

    // Auth SignUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: 'QA테스트기자',
                login_id: reporterId,
                role: 'reporter',
                needs_password_change: true
            }
        }
    });

    if (signUpError) {
        console.log('가입 시도 결과 (이미 존재할 수 있음):', signUpError.message);
    } else {
        console.log('가입 성공:', signUpData.user.id);
    }

    // Login (ID -> Email Mapping)
    console.log(`[2단계] ID 매핑 로그인 테스트...`);
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('로그인 실패:', loginError.message);
    } else {
        console.log('로그인 성공! Metadata:', loginData.user.user_metadata);
        if (loginData.user.user_metadata.needs_password_change) {
            console.log('[검증 완료] password_change 플래그 확인됨.');
        }
    }
}

verifyReporterFlow();
