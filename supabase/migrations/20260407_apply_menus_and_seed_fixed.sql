-- 1. menus 테이블 생성 (트리 구조 및 노출 설정 지원)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS(Row Level Security) 설정
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

-- 관리자 권한 임시 설정 (이후 profiles 연동 시 구체화)
-- 로그인한 모든 사용자(인증된 사용자)가 메뉴를 관리할 수 있도록 허용
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage menus') THEN
        CREATE POLICY "Authenticated users can manage menus"
        ON public.menus FOR ALL
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. 기본 레거시 카테고리 데이터 자동 삽입
INSERT INTO public.menus (name, sort_order, is_visible)
SELECT name, sort_order, is_visible
FROM (
    VALUES 
        ('일자리·취업', 1, true),
        ('주거·금융', 2, true),
        ('건강·의료', 3, true),
        ('생활·안전', 4, true),
        ('임신·육아', 5, true)
) AS t(name, sort_order, is_visible)
WHERE NOT EXISTS (
    SELECT 1 FROM public.menus WHERE menus.name = t.name
);
