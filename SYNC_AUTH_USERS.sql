-- ========================================================================================
-- [Supabase 자동 회원가입 동기화 트리거]
-- 목적: 구글 로그인(auth.users) 시 퍼블릭 회원관리 테이블(public.users)에 자동으로 데이터를 복사합니다.
-- ========================================================================================

-- 1. 동기화 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, grade, specialty, join_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '구글회원'),
    NEW.email,
    'user',
    'Lv.1',
    '일반',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 새 유저 가입 시 자동 실행되는 트리거 등록
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================================================
-- [기존 가입자(구글) 수동 복구]
-- 목적: 이 트리거를 만들기 전에 이미 로그인(가입)했던 계정들을 회원관리 테이블에 밀어넣습니다.
-- ========================================================================================
INSERT INTO public.users (id, name, email, role, grade, specialty, join_date)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '구글회원'), 
    email, 
    'user', 
    'Lv.1', 
    '일반', 
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
