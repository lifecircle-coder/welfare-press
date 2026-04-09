-- public.users 테이블에 기사 상세 페이지 노출용 이메일 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_display TEXT;

-- 주석 추가
COMMENT ON COLUMN public.users.email_display IS '기사 상세 페이지에 노출될 기자의 공개 이메일 주소';
