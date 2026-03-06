'use server';

import { createClient } from '@supabase/supabase-js';

// Admin 권한을 가진 Supabase 클라이언트 생성 함수
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Supabase 설정(URL 또는 Service Role Key)이 누락되었습니다. .env.local 파일을 확인하고 서버를 재시작해 주세요.');
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

interface CreateReporterParams {
    name: string;
    loginId: string;
    password: string;
    specialty: string;
}

export async function createReporterAction({ name, loginId, password, specialty }: CreateReporterParams) {
    try {
        const internalEmail = `${loginId}@welfare-press.admin`;

        // 1. Auth 계정 생성 (Admin API 사용 - 이메일 확인 우회 및 즉시 활성화)
        const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
            email: internalEmail,
            password: password,
            email_confirm: true, // 즉시 이메일 승인 처리
            user_metadata: {
                name: name,
                full_name: name,
                login_id: loginId,
                role: 'reporter',
                needs_password_change: true
            }
        });

        if (authError) {
            console.error('Admin API Auth Error:', authError);
            throw new Error(authError.message);
        }

        if (!authData.user) {
            throw new Error('계정 생성 후 유저 정보를 가져올 수 없습니다.');
        }

        // 2. public.users 테이블에 정보 삽입
        // 트리거가 동작하겠지만, role과 specialty 등을 확실히 하기 위해 UPSERT 시도
        const { error: dbError } = await getSupabaseAdmin()
            .from('users')
            .upsert({
                id: authData.user.id,
                name: name,
                email: internalEmail,
                role: 'reporter',
                specialty: specialty,
                grade: 'Lv.8',
                join_date: new Date().toISOString()
            });

        if (dbError) {
            console.error('Admin API DB Error:', dbError);
            throw new Error(dbError.message);
        }

        return { success: true, userId: authData.user.id };
    } catch (error: any) {
        console.error('createReporterAction failed:', error);
        return { success: false, error: error.message };
    }
}
