-- articles 테이블의 category 체크 제약 조건 제거
-- 기존 제약 조건은 ('All', 'Childcare', 'Jobs', 'Housing', 'Health', 'Safety')와 같이 
-- 하드코딩된 값만 허용하고 있어 동적 메뉴 추가 시 오류가 발생합니다.

DO $$
BEGIN
    -- 제약 조건 이름이 확실하지 않을 수 있으므로, 
    -- information_schema를 통해 category 컬럼의 CHECK 제약 조건을 찾아 삭제합니다.
    DECLARE
        constraint_name_var TEXT;
    BEGIN
        SELECT tc.constraint_name 
        INTO constraint_name_var
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.check_constraints AS cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.constraint_type = 'CHECK' 
          AND tc.table_name = 'articles'
          AND kcu.column_name = 'category';

        IF constraint_name_var IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.articles DROP CONSTRAINT ' || constraint_name_var;
        END IF;
    END;
END $$;
