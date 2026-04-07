-- 1. 잘못 생성되었던 profiles 테이블 삭제 (기존 데이터와 충돌 방지)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. 기존 잘못된 권한 정책 삭제 (꼬임 방지)
DROP POLICY IF EXISTS "Managers and Masters can manage menus" ON public.menus;
DROP POLICY IF EXISTS "Authenticated users can manage menus" ON public.menus;
DROP POLICY IF EXISTS "Admins can manage menus" ON public.menus;

-- 3. 실제 DB에 존재하는 public.users 기반으로 권한 재설정
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage menus') THEN
        CREATE POLICY "Admins can manage menus" ON public.menus FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid() AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- 4. 무결성을 위해 메뉴 데이터 전체 초기화 후 정확하게 삽입
TRUNCATE TABLE public.menus CASCADE;

-- 5. 1Depth(대분류) 데이터 삽입
INSERT INTO public.menus (name, sort_order, is_visible)
VALUES 
    ('일자리·취업', 1, true),
    ('주거·금융', 2, true),
    ('건강·의료', 3, true),
    ('생활·안전', 4, true),
    ('임신·육아', 5, true);

-- 6. 2Depth(소분류/말머리) 데이터 삽입 (기존 4개씩 완전 복원)
INSERT INTO public.menus (name, parent_id, sort_order, is_visible)
SELECT sub.name, m.id, sub.sort_order, true
FROM public.menus m
JOIN (
    VALUES 
    ('일자리·취업', '일자리', 1), ('일자리·취업', '취업', 2), ('일자리·취업', '창업', 3), ('일자리·취업', '교육', 4),
    ('주거·금융', '주거', 1), ('주거·금융', '금융', 2), ('주거·금융', '청약', 3), ('주거·금융', '대출', 4),
    ('건강·의료', '건강', 1), ('건강·의료', '의료', 2), ('건강·의료', '보험', 3), ('건강·의료', '운동', 4),
    ('생활·안전', '생활', 1), ('생활·안전', '안전', 2), ('생활·안전', '교통', 3), ('생활·안전', '환경', 4),
    ('임신·육아', '임신', 1), ('임신·육아', '육아', 2), ('임신·육아', '보육', 3), ('임신·육아', '지원', 4)
) AS sub(parent_name, name, sort_order) ON m.name = sub.parent_name;
