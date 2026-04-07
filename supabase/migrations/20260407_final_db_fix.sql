-- 1. profiles 테이블 확인 및 생성 (기존 schema.sql 복원)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    user_level INT DEFAULT 1 CHECK (user_level IN (1, 8, 9, 10)),
    specialty TEXT,
    account_origin TEXT DEFAULT 'google' CHECK (account_origin IN ('google', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- profiles 권한설정 (기본 설정 보호)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- 2. menus 테이블 생성 (트리 구조 및 노출 설정 지원)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. menus 권한 설정 (profiles 기반 정상 검증 강력 적용)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Menus are viewable by everyone') THEN
        CREATE POLICY "Menus are viewable by everyone" ON public.menus FOR SELECT USING (TRUE);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Managers and Masters can manage menus') THEN
        CREATE POLICY "Managers and Masters can manage menus" ON public.menus FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.user_level >= 9
            )
        );
    END IF;
END $$;

-- 4. 1Depth(대분류) 데이터 삽입 (존재하지 않을 때만 방어적으로 삽입)
INSERT INTO public.menus (name, sort_order, is_visible)
SELECT name, sort_order, is_visible FROM (
    VALUES 
        ('일자리·취업', 1, true),
        ('주거·금융', 2, true),
        ('건강·의료', 3, true),
        ('생활·안전', 4, true),
        ('임신·육아', 5, true)
) AS v(name, sort_order, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.menus WHERE name = v.name AND parent_id IS NULL);

-- 5. 2Depth(소분류/말머리) 데이터 삽입 (기존 4개씩 완전 복원)
INSERT INTO public.menus (name, parent_id, sort_order, is_visible)
SELECT sub.name, m.id, sub.sort_order, true
FROM public.menus m
JOIN (
    VALUES 
    -- 일자리·취업
    ('일자리·취업', '일자리', 1), ('일자리·취업', '취업', 2), ('일자리·취업', '창업', 3), ('일자리·취업', '교육', 4),
    -- 주거·금융
    ('주거·금융', '주거', 1), ('주거·금융', '금융', 2), ('주거·금융', '청약', 3), ('주거·금융', '대출', 4),
    -- 건강·의료
    ('건강·의료', '건강', 1), ('건강·의료', '의료', 2), ('건강·의료', '보험', 3), ('건강·의료', '운동', 4),
    -- 생활·안전
    ('생활·안전', '생활', 1), ('생활·안전', '안전', 2), ('생활·안전', '교통', 3), ('생활·안전', '환경', 4),
    -- 임신·육아
    ('임신·육아', '임신', 1), ('임신·육아', '육아', 2), ('임신·육아', '보육', 3), ('임신·육아', '지원', 4)
) AS sub(parent_name, name, sort_order) ON m.name = sub.parent_name AND m.parent_id IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM public.menus m2 WHERE m2.name = sub.name AND m2.parent_id = m.id
);
