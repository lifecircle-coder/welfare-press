import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 홈페이지(Public)용 Supabase 클라이언트
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-public-auth' // 키 분리
    }
});

// 관리자(Admin)용 Supabase 클라이언트 (RLS 우회 및 데이터 팩토리용)
export const adminSupabase = createClient(
    supabaseUrl, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey, // 서버 사이드에서는 서비스 롤 키 사용
    {
        auth: {
            persistSession: false, // 서버 사이드 작업 위주이므로 세션 유지 불필요
            autoRefreshToken: false
        }
    }
);
