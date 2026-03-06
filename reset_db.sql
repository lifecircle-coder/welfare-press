-- ========================================================================================
-- [언론사 프로젝트 - 시스템 데이터베이스 완전 초기화 및 마스터 계정 통합 설정]
-- 목적: 모든 데이터를 삭제하고 'master' 계정을 충돌 없이 완벽하게 생성합니다.
-- ========================================================================================

-- 1. 모든 공개 데이터 테이블 삭제 (순서 주의: 외래 키 고려)
DELETE FROM public.comments;
DELETE FROM public.articles;
DELETE FROM public.inquiries;
DELETE FROM public.daily_visits;
DELETE FROM public.users;

-- 2. 인증 계정 데이터 삭제 (전체 초기화)
DELETE FROM auth.users;

-- 3. 마스터 계정 고정 정보 정의
DO $$
DECLARE
  master_uuid uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 4. auth.users 에 마스터 계정 삽입 (또는 업데이트)
  -- 이메일: master@welfare-press.admin
  -- 비밀번호: dldjtkfl@2026
  INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    confirmation_token, 
    email_change, 
    email_change_token_new, 
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    master_uuid, 
    'authenticated', 
    'authenticated', 
    'master@welfare-press.admin', 
    crypt('dldjtkfl@2026', gen_salt('bf')), 
    NOW(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"최고관리자", "role":"admin"}', 
    NOW(), 
    NOW(), 
    '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

  -- 5. public.users 테이블에 마스터 정보 삽입 (또는 업데이트)
  -- 트리거가 이미 'user' 역할로 삽입했을 수도 있으므로, 여기서 'admin'으로 강제 업데이트합니다.
  INSERT INTO public.users (
    id, 
    name, 
    email, 
    role, 
    grade, 
    specialty, 
    join_date
  ) VALUES (
    master_uuid::text, 
    '최고관리자', 
    'master@welfare-press.admin', 
    'admin', 
    'Lv.99', 
    '전체', 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    grade = 'Lv.99',
    name = EXCLUDED.name,
    email = EXCLUDED.email;

END $$;
