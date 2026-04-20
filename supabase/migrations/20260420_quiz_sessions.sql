-- ============================================================
-- Phase 1-2: 퀴즈 세션 + 인증서 테이블
-- 비로그인 사용자도 session_token(UUID)으로 상태 유지
-- ============================================================

CREATE TABLE public.quiz_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  -- 클라이언트 localStorage 저장용 UUID, 재방문 시 세션 연속성 보장
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 로그인 사용자 연결 (미로그인 NULL)

  -- 상황 입력 스냅샷 (퀴즈 필터링 기준값)
  region          TEXT NOT NULL,
  -- '서울 관악구', '경기 수원시' 등
  age             SMALLINT NOT NULL,
  household_type  TEXT NOT NULL,
  -- '1인가구' | '2인가구' | '3인이상'
  income_level    TEXT NOT NULL,
  -- '중위50%이하' | '중위60%이하' | '중위100%이하' | '전체'

  -- 퀴즈 진행 상태
  status          TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','expired')),
  answers         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{quiz_id, policy_id, answer, is_correct, answered_at}]
  score           SMALLINT,
  -- 정답 수 (완료 시 집계)
  total_questions SMALLINT,
  -- 출제된 총 문제 수

  -- 인증서 데이터 (완료 시 스냅샷 저장 — 정책 DB 변경에도 인증서 불변 보장)
  eligible_policies     JSONB,
  -- [{policy_id, policy_name, max_benefit_amount, benefit_description}]
  total_benefit_amount  INTEGER,
  -- 수혜 가능 정책 합산액 (만원)
  certificate_issued_at TIMESTAMPTZ,
  -- 인증서 발급 시각

  -- 바이럴 지표
  share_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

COMMENT ON TABLE public.quiz_sessions IS '복지 퀴즈 세션 + 인증서 테이블';
COMMENT ON COLUMN public.quiz_sessions.session_token IS 'localStorage 저장 UUID, 비로그인 세션 식별자';
COMMENT ON COLUMN public.quiz_sessions.answers IS 'JSONB 배열: [{quiz_id, policy_id, answer, is_correct, answered_at}]';
COMMENT ON COLUMN public.quiz_sessions.eligible_policies IS '인증서 스냅샷: [{policy_id, policy_name, max_benefit_amount, benefit_description}]';
COMMENT ON COLUMN public.quiz_sessions.total_benefit_amount IS '수혜 가능 정책 합산액 (만원 단위)';

-- 인덱스
CREATE INDEX idx_quiz_sessions_token      ON public.quiz_sessions (session_token);
CREATE INDEX idx_quiz_sessions_user_id    ON public.quiz_sessions (user_id);
CREATE INDEX idx_quiz_sessions_expires_at ON public.quiz_sessions (expires_at);
CREATE INDEX idx_quiz_sessions_status     ON public.quiz_sessions (status);

-- RLS: Next.js API Route + adminSupabase 경유 (기존 패턴 동일)
-- 퍼블릭 클라이언트 직접 접근 차단, API Route에서 session_token 검증 후 처리
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
