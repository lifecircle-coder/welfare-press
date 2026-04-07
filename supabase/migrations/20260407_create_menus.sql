-- 1. menus 테이블 생성 (트리 구조 및 노출 설정 지원)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. articles 테이블의 기존 하드코딩된 카테고리 제약 조건 제거
-- 이를 통해 관리자에서 동적으로 설정한 카테고리명을 자유롭게 저장할 수 있게 됩니다.
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_category_check;

-- 3. RLS(Row Level Security) 설정
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- 모든 사용자: 메뉴 조회 가능
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Menus are viewable by everyone') THEN
        CREATE POLICY "Menus are viewable by everyone" 
        ON public.menus FOR SELECT 
        USING (TRUE);
    END IF;
END $$;

-- 관리자(매니저 레벨 9 이상): 메뉴 전체 관리 가능
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Managers and Masters can manage menus') THEN
        CREATE POLICY "Managers and Masters can manage menus"
        ON public.menus FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.user_level >= 9
            )
        );
    END IF;
END $$;

-- 📝 실행 방법: 
-- 위 쿼리를 복사하여 Supabase 대시보드의 'SQL Editor'에서 실행해 주세요.
