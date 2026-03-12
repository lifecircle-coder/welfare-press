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

/**
 * 기자의 정보를 수정하고 전역적으로 반영합니다. (Auth 메타데이터 포함)
 */
export async function updateUserAction({ userId, oldName, newName }: { userId: string, oldName: string, newName: string }) {
    try {
        const admin = getSupabaseAdmin();

        // 1. Auth 메타데이터 업데이트
        const { error: authError } = await admin.auth.admin.updateUserById(userId, {
            user_metadata: {
                name: newName,
                full_name: newName
            }
        });
        if (authError) throw authError;

        // 2. DB 정보 및 관련 콘텐츠 일괄 업데이트
        const { updateUserWithContent } = await import('@/lib/services');
        const result = await updateUserWithContent(userId, oldName, newName, admin);
        
        if (!result.success) throw result.error;

        return { success: true };
    } catch (error: any) {
        console.error('updateUserAction failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 기자 계정을 삭제합니다.
 */
export async function deleteUserAction(userId: string) {
    try {
        const admin = getSupabaseAdmin();

        // 1. Auth 계정 삭제
        const { error: authError } = await admin.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        // 2. DB users 레코드 삭제 (Cascade 설정에 의해 하위 데이터가 영향을 받을 수 있으므로 주의)
        const { error: dbError } = await admin
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (dbError) throw dbError;

        return { success: true };
    } catch (error: any) {
        console.error('deleteUserAction failed:', error);
        return { success: false, error: error.message };
    }
}

