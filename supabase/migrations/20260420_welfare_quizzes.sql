-- ============================================================
-- Phase 1-1: 복지 퀴즈 콘텐츠 테이블
-- 정책 15개 × 2문제 = 30행 예정
-- ============================================================

CREATE TABLE public.welfare_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 정책 공통 정보 (같은 policy_id끼리 동일값)
  policy_id           TEXT NOT NULL,
  policy_name         TEXT NOT NULL,
  policy_category     TEXT NOT NULL
    CHECK (policy_category IN ('청년','아동','노인','장애인','가족','기타')),
  max_benefit_amount  INTEGER,
  -- 연간 최대 수혜액 (만원 단위), NULL = 금액 미정 또는 현물 지원
  benefit_description TEXT,
  -- 예: '월 최대 20만원 × 12개월 = 연 240만원'

  -- 문제 정보
  question_order  SMALLINT NOT NULL DEFAULT 1
    CHECK (question_order BETWEEN 1 AND 2),
  question        TEXT NOT NULL,
  question_type   TEXT NOT NULL DEFAULT 'ox'
    CHECK (question_type IN ('ox','multiple')),
  options         JSONB NOT NULL,
  -- ox:       [{"label":"예","value":"yes"},{"label":"아니오","value":"no"}]
  -- multiple: [{"label":"선택지A","value":"a"},{"label":"선택지B","value":"b"},...]
  correct_answer  TEXT NOT NULL,
  explanation     TEXT,
  -- 정답 해설 (학습 콘텐츠, 퀴즈 완료 후 노출)

  -- 수혜 대상 필터 (상황 입력 매칭용 — NULL = 제한 없음/전체)
  target_age_min          SMALLINT,
  target_age_max          SMALLINT,
  target_income_levels    TEXT[],
  -- NULL = 전체, ARRAY['중위50%이하','중위60%이하','중위100%이하']
  target_household_types  TEXT[],
  -- NULL = 전체, ARRAY['1인가구','2인가구','3인이상']
  target_regions          TEXT[],
  -- NULL = 전국, ARRAY['서울','경기']

  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (policy_id, question_order)
);

COMMENT ON TABLE public.welfare_quizzes IS '복지 퀴즈 문제 테이블 (정책별 2문제 × 15정책)';
COMMENT ON COLUMN public.welfare_quizzes.policy_id IS '정책 식별자 (예: youth_rent_support)';
COMMENT ON COLUMN public.welfare_quizzes.max_benefit_amount IS '연간 최대 수혜액 (만원 단위)';
COMMENT ON COLUMN public.welfare_quizzes.options IS 'JSONB 선택지 배열: [{label, value}]';
COMMENT ON COLUMN public.welfare_quizzes.target_regions IS 'NULL = 전국, 배열 = 해당 지역만';

-- 인덱스
CREATE INDEX idx_welfare_quizzes_policy_id ON public.welfare_quizzes (policy_id);
CREATE INDEX idx_welfare_quizzes_active    ON public.welfare_quizzes (is_active, sort_order);

-- RLS: 누구나 조회, 쓰기는 서비스 롤 키 전용
ALTER TABLE public.welfare_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈 공개 읽기"
  ON public.welfare_quizzes
  FOR SELECT
  USING (TRUE);
