-- pSEO 전용 데이터 인프라 구축
-- 1. 지역(서울 25개 자치구) 테이블
CREATE TABLE IF NOT EXISTS public.welfare_regions (
    id TEXT PRIMARY KEY, -- 예: 'mapo-gu'
    name TEXT NOT NULL,  -- 예: '마포구'
    description TEXT,    -- AI 생성 지역별 MZ 타겟 설명
    population_youth INTEGER DEFAULT 0, -- 청년 인구 (수동/API 병합용)
    avg_rent_officetel INTEGER DEFAULT 0, -- 평균 오피스텔 월세 (단위: 원)
    keywords TEXT[],     -- 지역 관련 키워드
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 복지 정책 테이블 (AI 정제 버전)
CREATE TABLE IF NOT EXISTS public.welfare_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id TEXT UNIQUE NOT NULL, -- 공공 API 원문 ID (중복 수집 방지)
    source TEXT NOT NULL,             -- NATIONAL, YOUTH, LOCAL 등
    category TEXT,                   -- 주거, 일자리, 금융 등
    title TEXT NOT NULL,              -- AI가 검색 최적화한 제목
    original_title TEXT,             -- 공공 API 원본 제목
    content_summary TEXT,            -- AI가 요약한 MZ 스타일 본문
    eligibility TEXT,                -- 지원 대상 (AI 정제)
    benefits TEXT,                   -- 지원 혜택 (AI 정제)
    application_method TEXT,         -- 신청 방법 (AI 정제)
    deadline_date DATE,              -- 마감일 (정렬용)
    deadline_text TEXT,              -- 마감 정보 텍스트 (예: '예산 소진 시까지')
    ai_score INTEGER DEFAULT 0,      -- 혜택 강도/중요도 점수 (1-10)
    view_count INTEGER DEFAULT 0,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 지역-정책 매핑 테이블 (1:N 또는 N:M 대응)
CREATE TABLE IF NOT EXISTS public.welfare_region_policies (
    region_id TEXT REFERENCES public.welfare_regions(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES public.welfare_policies(id) ON DELETE CASCADE,
    PRIMARY KEY (region_id, policy_id)
);

-- RLS 설정 (읽기 전용 공개)
ALTER TABLE public.welfare_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_region_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on regions" ON public.welfare_regions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on policies" ON public.welfare_policies FOR SELECT USING (true);
CREATE POLICY "Allow public read access on region_policies" ON public.welfare_region_policies FOR SELECT USING (true);

-- 수정 권한은 admin만 가능 (필요 시 adminSupabase 사용)
