# THE복지 pSEO 킬러콘텐츠 마스터 플랜 [FINAL]
> 작성일: 2026-04-17 | 작성자: PM Jay  
> 상태: **대표님 최종 검토 및 승인 대기**  
> **⚠️ 이 파일은 절대 삭제·덮어쓰기 금지. 수정 시 반드시 날짜 버전으로 별도 파일 생성.**

---

## 0. 이 문서의 목적과 사용법

이 문서는 **THE복지 pSEO 킬러콘텐츠 프로젝트**의 최종 실행 지침서다.  
케이(Kay, 기획), 비(Bee, 백엔드), 에프(Eff, 프론트엔드) 등 모든 팀원이 이 문서 하나만 읽고  
**추가 질문 없이 100% 구현할 수 있는 완전 명세서**로 작성되었다.

### 이전 문서와의 관계
| 파일명 | 역할 | 상태 |
|--------|------|------|
| `PSEO_DEV_PLAN_v1.md` | 기술 명세 기반서 (DB 스키마, 컴포넌트 명세) | 보존 (참조용) |
| `PSEO_DEV_PLAN_v2.md` | 자동화 전략서 (Gemini API, 데이터 파이프라인) | 보존 (참조용) |
| **`PSEO_MASTER_PLAN_FINAL.md` (이 파일)** | **v1 + v2 통합 최종 마스터** | ✅ 현행 기준 |

---

## 1. 프로젝트 목적 및 핵심 목표

### 1-1. 왜 pSEO를 하는가? (3가지 검증 목표)

1. **트래픽 검증**: Zapier처럼 pSEO 페이지를 구축해 실제 오가닉 검색 트래픽을 모을 수 있는가?
2. **재방문율 검증**: 방문자가 실질적이고 정확한 도움을 받아 스스로 다시 찾아오는가?
3. **바이럴 검증**: 양질의 콘텐츠로 방문자가 자연스럽게 지인에게 공유하여 추가 트래픽이 생기는가?

### 1-2. MVP 범위 (합의 확정)
- **대상 지역**: 서울 25개 구 우선 → 수도권 핵심 시 확장
- **목표 페이지**: 100개 (1차 파일럿)
- **타겟 사용자**: 19~34세 MZ세대 청년

### 1-3. MZ세대 행동 패턴 분석 (콘텐츠 전략의 핵심 근거)

2026년 MZ세대는 다음 3가지 성향을 갖는다:

| 특성 | 설명 | 이 프로젝트에서의 구현 방식 |
|------|------|--------------------------|
| **초효율(필코노미)** | 결론부터, 3초 이내에 "내가 받을 수 있냐"를 알고 싶다 | 히어로 섹션에 "최대 월 NN만원" 숫자를 가장 크게 노출 |
| **초개인화** | "나에게 직결된 정보"만 관심. 타인 비교 불필요 | 지역명이 URL·제목·본문에 명시, 나이/소득 기반 필터 |
| **근본이즘** | 화려한 UI보다 정보 자체가 신뢰할 수 있어야 한다 | 출처(정책번호, 담당부처, 공식링크)를 모든 카드에 노출 |

### 1-4. KPI (성공 기준)
- 구글 색인(Index) 달성: 100개 페이지
- 월 오가닉 방문자: 1,000명 이상 (3개월 후)
- 페이지당 평균 체류시간: 2분 이상
- 특정 페이지 재방문율: 20% 이상

---

## 2. 콘텐츠 전략: "Zapier 방식의 복지 매트릭스"

### 2-1. Zapier 벤치마킹

Zapier는 **[앱 A] × [앱 B]** 의 N×N 매트릭스로 수백만 개의 pSEO 페이지를 운영한다.  
THE복지는 이를 **[지역] × [정책 카테고리]** 로 치환한다.

```
Zapier:  Gmail + Slack = 1개 페이지 → 수백만 개 조합
THE복지: 관악구 + 청년주거지원 = 1개 페이지 → 100개 조합 (MVP)
```

**Zapier의 핵심 성공 요인 (우리가 반드시 따를 것):**
- 각 페이지에 **'나만을 위한 구체적인 데이터'** 가 있어야 한다 (Thin Content 방지)
- 단순 목록이 아닌 **'인터랙티브 도구'** 가 있어야 한다 (계산기, 체크리스트)
- **강력한 내부 링크 구조** 로 크롤링 효율을 높인다

### 2-2. 메인 킬러콘텐츠: "지역별 청년 복지 완전 가이드"

**페이지 제목 공식 (절대 변경 금지):**
```
{지역명} 청년이라면 2026년 지금 당장 받을 수 있는 복지 총정리
```

예시:
- `관악구 청년이라면 2026년 지금 당장 받을 수 있는 복지 총정리`
- `마포구 청년이라면 2026년 지금 당장 받을 수 있는 복지 총정리`

이 제목 공식이 실제 청년들의 검색 의도(Search Intent)와 정확히 일치하기 때문이다.

### 2-3. 재방문 유도 엔진 (핵심 미션)

외부 알림(앱/이메일/SNS) 없이도 방문자가 **페이지 자체를 보며** "이 페이지는 계속 업데이트되니 다시 와야겠다"는 행동을 유발하는 4가지 장치:

#### ① D-Day 카운터 (매일 자동 변경)
- 신청 마감일까지 남은 일수를 매일 자동 계산
- "D-17" → "D-16" → 카운터가 줄어드는 것 자체가 "살아있는 페이지" 증명
- 마감일 없는 상시 정책: 예산 소진율로 대체

#### ② 예산 소진율 게이지 (긴박감 생성)
- `현재 78% 소진 (잔여 예산 약 2,200만원 추정)` 시각화
- 소진율 80% 이상 → 빨간색, 손실 회피 심리 자극
- **[주요 데이터 한계]**: 실시간 예산 잔액 API는 공공에서 미제공.  
  → 해결책: 정책 발표 예산 총액(DB 입력) + 월평균 지출 통계 기반 **AI 추정값** 활용

#### ③ 지역 복지 뉴스 피드 (매일 자동 갱신)
- THE복지 `articles` 테이블에서 해당 지역명 키워드로 필터링한 최신 기사 자동 노출
- 매일 새 기사가 붙어 "오늘도 업데이트됨" 신호를 페이지가 스스로 발신
- THE복지가 미디어사이기 때문에 가장 자연스럽고 신뢰도 높은 포맷

#### ④ NEW 배지 시스템 (변화 감지 유도)
- 지난 30일 내 신설·변경된 정책에 `🆕 NEW` 자동 배지
- `신설 (2026.04.01)`, `조건 완화 (2026.03.15)` 형태로 구체적 변경 날짜 표시
- 재방문 시 "저번엔 없었던 게 생겼네" 인식 유도

---

## 3. 데이터 전략: "프로그래매틱 데이터 팩토리 (PDF)"

### 3-1. 공공 API의 현실과 해결책

공공 API에서 제공하는 날것(Raw) 데이터의 한계:

| 항목 | 공공 API 실제 상태 | 우리의 해결책 |
|------|------------------|-------------|
| 지원금액 | 긴 설명문 속에 텍스트로 섞여 있음 | Gemini AI가 숫자만 추출 |
| 신청 마감일 | "2026.04.01~04.30" 텍스트 | 날짜 파서(Parser)로 자동 변환 |
| 예산 소진율 | **미제공** (가장 큰 구멍) | 초기값 입력 + AI 추정 로직 |
| 담당 부서/연락처 | 비교적 잘 제공됨 | 그대로 활용 |
| 자격 요건 | 공무원 말투 긴 문장 | Gemini AI가 3줄 요약 |

### 3-2. 4단계 데이터 파이프라인 (완전 자동화)

```
[STEP 1: 수집] 매일 새벽 03:00 - Cron Job 실행
    └─ 온라인청년센터 API (청년정책 목록)
    └─ 보조금24 API (중앙부처 정책)
    └─ 지자체복지서비스 API (지역 고유 정책)
           ↓
[STEP 2: 정제] Gemini 1.5 Flash API (비용: 무료 티어)
    └─ 지원금액 숫자 추출 → support_amount 필드
    └─ 신청 마감일 파싱 → apply_end_date 필드 (DATE 형식)
    └─ 자격요건 3줄 요약 → MZ 문체로 변환
    └─ SEO 메타 설명 자동 생성
           ↓
[STEP 3: 강화] 서브 데이터 병합 (빈 필드 채우기)
    └─ 지역 평균 월세 → avg_rent (정적 배열로 내장 관리)
    └─ 지역 청년 인구 → youth_population (서울 열린데이터)
    └─ 부동산 시세 연관 문구 자동 생성
           ↓
[STEP 4: 저장] Supabase DB 업서트(Upsert)
    └─ 기존 데이터 대비 변경 시 → change_log JSONB에 기록
    └─ 신규 정책 → is_new = true, new_until = 30일 후
    └─ 품질 스코어(quality_score) 0~100 자동 계산
```

### 3-3. AI 품질 스코어 시스템 (수동 검수 대체)

대표님이 1만 페이지를 수동 검수하는 대신, 시스템이 자동으로 점수를 부여한다.

| 점수 범위 | 상태 | 조치 |
|-----------|------|------|
| 80~100점 | ✅ 우수 | 자동 인덱싱 허용 |
| 60~79점 | 🟡 보통 | 인덱싱 허용, 보강 예정으로 표시 |
| 40~59점 | 🟠 미흡 | 인덱싱 허용, 어드민 대시보드 주의 표시 |
| 0~39점 | 🔴 불량 | `noindex` 처리, 어드민 긴급 알림 |

**점수 계산 로직:**
```typescript
function calcQualityScore(policy: WelfarePolicy): number {
  let score = 0;
  if (policy.support_amount && policy.support_amount > 0) score += 30; // 지원금액
  if (policy.apply_end_date) score += 20;                               // 마감일
  if (policy.age_min && policy.age_max) score += 15;                    // 나이 기준
  if (policy.income_criteria) score += 15;                              // 소득 기준
  if (policy.apply_url) score += 10;                                     // 신청 링크
  if (policy.apply_method) score += 10;                                  // 신청 방법
  return score; // 최대 100
}
```

---

## 4. 기술 아키텍처

### 4-1. URL 구조 및 라우팅

```
/welfare                          # 허브 페이지 (지역 선택)
/welfare/[region]                 # 지역별 메인 pSEO 페이지 (핵심)
/welfare/[region]/[policy-slug]   # 정책 상세 페이지 (선택적)
```

예시:
```
/welfare/gwanak-gu                # 관악구 청년 복지 총정리
/welfare/mapo-gu                  # 마포구 청년 복지 총정리
/welfare/suwon-si                 # 수원시 청년 복지 총정리
```

### 4-2. 디렉토리 구조 (기존 /welfare 전면 폐기 후 신규 구축)

```
src/app/(public)/welfare/
├── page.tsx                          # 허브 (지역 선택 인터랙티브 맵)
├── [region]/
│   ├── page.tsx                      # 지역별 메인 pSEO 페이지
│   └── [policy]/
│       └── page.tsx                  # 정책 상세 (Phase 2)
└── _components/
    ├── WelfareHeroSection.tsx         # 히어로 (제목 + 총지원금)
    ├── PolicyCard.tsx                 # 정책 카드 (D-Day, 배지 포함)
    ├── DdayCounter.tsx                # D-Day 자동 계산기
    ├── BudgetMeter.tsx                # 예산 소진율 게이지
    ├── LocalNewsFeed.tsx              # 지역 뉴스 피드
    ├── NewBadge.tsx                   # NEW 배지
    ├── WelfareCalculator.tsx          # 자격 판독기
    ├── ShareCard.tsx                  # 카카오 공유 카드
    └── RegionMap.tsx                  # 서울 SVG 지도

src/lib/
├── welfare-data-factory.ts           # 데이터 파이프라인 (정제/강화)
└── welfare-api.ts                    # 공공 API 연동 함수

src/app/api/welfare/
├── sync/route.ts                     # 배치 동기화 엔드포인트 (Cron 대상)
└── og/route.ts                       # 공유 카드 이미지 생성 API
```

---

## 5. Supabase DB 스키마 (신규 테이블 3개)

> [!IMPORTANT]
> 반드시 아래 순서대로 생성. 외래키 의존성 때문에 순서 변경 불가.

### 5-1. `welfare_regions` 테이블 (1번 생성)
```sql
CREATE TABLE welfare_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,               -- "관악구"
  name_en TEXT NOT NULL,            -- "gwanak-gu"
  slug TEXT UNIQUE NOT NULL,        -- URL 식별자 "gwanak-gu"
  city TEXT NOT NULL,               -- "서울특별시"
  region_type TEXT NOT NULL,        -- "gu" | "si" | "gun" | "dong"
  
  -- 지역 맥락 데이터 (차별화 콘텐츠의 핵심)
  population_youth INTEGER,         -- 청년 인구 수 (서울 열린데이터 기준)
  avg_rent_1room INTEGER,           -- 1인실 평균 월세 (원) ex: 650000
  avg_rent_source TEXT DEFAULT '2026년 부동산원 통계',
  local_office_name TEXT,           -- "관악구청 청년정책과"
  local_office_phone TEXT,          -- "02-879-5000"
  local_office_url TEXT,            -- 구청 청년정책 페이지 URL
  
  -- 운영
  priority INTEGER DEFAULT 0,       -- 허브 페이지 노출 순서
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_welfare_regions_slug ON welfare_regions(slug);
CREATE INDEX idx_welfare_regions_city ON welfare_regions(city);
```

### 5-2. `welfare_policies` 테이블 (2번 생성)
```sql
CREATE TABLE welfare_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,         -- "monthly-rent-special-support"
  name TEXT NOT NULL,                -- "청년 월세 한시 특별지원"
  policy_type TEXT NOT NULL,         -- "national" | "local"
  category TEXT NOT NULL,            -- "housing" | "employment" | "education" | "living" | "health"
  
  -- 지원 내용 (AI 정제 결과)
  support_amount INTEGER,            -- 월 지원금액(원) ex: 200000
  support_duration TEXT,             -- "최대 12개월"
  support_description TEXT,          -- MZ 문체로 요약된 설명 (3줄)
  support_description_raw TEXT,      -- 원문 공공 API 텍스트 (백업)
  
  -- 자격 요건 (AI 정제 결과 - 최대 3줄)
  age_min INTEGER DEFAULT 19,
  age_max INTEGER DEFAULT 34,
  income_criteria TEXT,              -- "중위소득 60% 이하"
  residence_criteria TEXT,           -- "해당 지역 거주 6개월 이상"
  other_criteria TEXT,
  
  -- 신청 정보
  apply_url TEXT,
  apply_method TEXT,                 -- "온라인" | "방문" | "우편" | "자동지급"
  apply_start_date DATE,
  apply_end_date DATE,               -- NULL = 상시 모집
  
  -- 예산 정보 (재방문 유도 핵심)
  total_budget BIGINT,               -- 총 예산 (원)
  used_budget_estimate BIGINT,       -- AI 추정 집행액
  total_quota INTEGER,               -- 총 지원 인원
  current_applicants INTEGER DEFAULT 0,
  
  -- 메타 및 자동화
  is_new BOOLEAN DEFAULT false,
  new_until DATE,                    -- NEW 배지 표시 마감
  change_log JSONB DEFAULT '[]'::JSONB,  -- [{"date":"2026-04-01","desc":"조건 완화"}]
  quality_score INTEGER DEFAULT 0,   -- AI 자동 계산 품질 점수 (0~100)
  is_indexed BOOLEAN DEFAULT true,   -- false면 noindex 처리
  data_source TEXT,                  -- "온라인청년센터API" | "보조금24API" | "수동"
  external_id TEXT,                  -- 원본 API의 고유ID (중복 방지)
  last_synced_at TIMESTAMPTZ,        -- 마지막 API 동기화 시각
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_welfare_policies_slug ON welfare_policies(slug);
CREATE INDEX idx_welfare_policies_category ON welfare_policies(category);
CREATE INDEX idx_welfare_policies_apply_end ON welfare_policies(apply_end_date);
CREATE INDEX idx_welfare_policies_quality ON welfare_policies(quality_score);
```

### 5-3. `welfare_region_policies` 테이블 (3번 생성)
```sql
CREATE TABLE welfare_region_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES welfare_regions(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES welfare_policies(id) ON DELETE CASCADE,
  
  -- 지역 고유 데이터 (전국 정책에 지역별 특수 조건 추가 가능)
  local_extra_amount INTEGER DEFAULT 0,  -- 지자체 자체 추가 지원금 (원)
  local_condition TEXT,                  -- 지역 특수 추가 조건
  local_apply_url TEXT,                  -- 지역 전용 신청 URL (있을 경우)
  local_office_override TEXT,            -- 지역 담당 부서 오버라이드
  
  priority INTEGER DEFAULT 0,           -- 해당 지역 내 노출 우선순위
  UNIQUE(region_id, policy_id)          -- 중복 방지
);

-- 인덱스
CREATE INDEX idx_wrp_region ON welfare_region_policies(region_id);
CREATE INDEX idx_wrp_policy ON welfare_region_policies(policy_id);
```

---

## 6. 공공 API 연동 명세

### 6-1. 현재 보유 API 목록 (검증 완료)

| 우선순위 | API명 | 엔드포인트 | 핵심 제공 데이터 | API 키 |
|---------|-------|-----------|----------------|--------|
| **1순위** | 온라인청년센터 청년정책 | `youthcenter.go.kr/go/ythip/getPlcy` | 청년 특화 정책 전체, 지역 필터 가능 | 보유 |
| **2순위** | 보조금24 (ODCloud) | `api.odcloud.kr/api/gov24/v1/list` | 중앙부처 전 정책, 신청URL 포함 | 보유 |
| **3순위** | 지자체복지서비스 | `apis.data.go.kr/B554287/LocalGovernmentWelfareInformations` | 지역 고유 복지사업 | 보유 |
| **4순위** | 중앙부처복지서비스 | `apis.data.go.kr/B554287/NationalWelfareInformationsV001` | 전국 단위 복지 정책 | 보유 |

### 6-2. 추가 필요 API 목록 (대표님 발급 요청)

> [!IMPORTANT]
> 아래 API는 현재 미보유 상태입니다. 데이터 품질 극대화를 위해 대표님께서 신청해 주셔야 합니다.

| API명 | 발급처 | 용도 | URL |
|-------|--------|------|-----|
| **서울 열린데이터광장 인증키** | data.seoul.go.kr | 자치구별 청년 인구 통계 | https://data.seoul.go.kr |
| **서울시 월세정보 API** | data.seoul.go.kr | 자치구별 평균 월세 데이터 (정적 배열로 대체 가능) | https://data.seoul.go.kr |
| **Gemini API 키** | aistudio.google.com | 공공 API 텍스트 → 정형 데이터 자동 정제 | https://aistudio.google.com (무료) |

> [!NOTE]
> **서울 월세 데이터**: API 발급이 어려울 경우, 한국부동산원 R-ONE 통계 기준으로 제이가 25개 구 평균 월세를 정적 배열로 코드에 내장합니다. (연 1~2회 수동 업데이트)  
> **Gemini API**: Google AI Studio에서 무료로 즉시 발급 가능. `GEMINI_API_KEY` 환경 변수에 추가.

### 6-3. API 호출 기본 규칙

```typescript
// ⚠️ 필수: serviceKey는 반드시 encodeURIComponent 적용
// 미적용 시 → SERVICE_KEY_IS_NOT_REGISTERED_ERROR 발생
const encodedKey = encodeURIComponent(process.env.PUBLIC_DATA_API_KEY!);

// ⚠️ 필수: 서버 사이드에서만 직접 호출
// 클라이언트 측 호출 → /api/public-data 프록시 경유
```

---

## 7. 데이터 정제 로직: Gemini AI 활용

### 7-1. Gemini 정제 프롬프트 명세

```typescript
// src/lib/welfare-data-factory.ts

const GEMINI_EXTRACT_PROMPT = (rawText: string) => `
당신은 대한민국 청년복지 정책 데이터 추출 전문가입니다.
아래 공공 API 원문에서 다음 정보를 JSON으로 추출하세요.
없는 정보는 null로 반환하세요. 추측하지 마세요.

추출 대상:
- support_amount: 월 지원금액(원, 숫자만). 예: 200000
- age_min: 최소 나이(숫자). 예: 19
- age_max: 최대 나이(숫자). 예: 34
- apply_end_date: 신청 마감일(YYYY-MM-DD). 예: "2026-06-30"
- income_criteria: 소득 기준 (한 문장 요약)
- summary_mz: MZ세대용 핵심 요약 (반말체 금지, 3줄 이내, 핵심만)

원문:
${rawText}

JSON만 반환:
`;
```

### 7-2. Gemini 호출 비용 최적화

- **모델**: `gemini-1.5-flash` (무료 티어: 일 1,500회 / 분 15회)
- **배치 처리**: 100개 정책을 1회 배치로 처리 → 1일 100회 호출 (무료 한도 내)
- **캐싱**: 동일한 `external_id`에 대해 변경 없으면 재호출 생략 (비용 0)
- **확장 시**: 1만 페이지로 확장해도 월 비용 수천 원 수준

---

## 8. 페이지별 UI/UX 상세 명세

### 8-1. 허브 페이지 `/welfare`

**SEO 메타데이터:**
```typescript
export const metadata = {
  title: '서울/수도권 청년 복지 지역별 완전 총정리 2026 | THE복지',
  description: '관악구, 마포구, 강남구 등 서울 25개 구 청년이라면 지금 당장 받을 수 있는 복지 지원금 총정리. 월세지원·취업지원·교육비 지원까지.',
}
```

**화면 구성:**
- 인터랙티브 서울시 SVG 지도 (구 클릭 → 해당 pSEO 페이지 이동)
- 지역 카드 그리드 (구명 + "최대 월 N만원" 숫자 표시)
- 상단: "내 지역 빠르게 찾기" 검색창

---

### 8-2. 메인 pSEO 페이지 `/welfare/[region]` (핵심)

**동적 SEO 메타데이터:**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const region = await getRegionBySlug(params.region);
  return {
    title: `${region.name} 청년 복지 2026 완전 총정리 | THE복지`,
    description: `${region.name} 청년이라면 지금 당장 받을 수 있는 복지 지원금 총정리. 청년 월세지원, 내일저축계좌, ${region.name} 자체 지원까지. 신청 방법과 마감일 포함.`,
    keywords: [`${region.name} 청년 복지`, `${region.name} 청년 지원금 2026`, `${region.name} 청년 월세 지원`],
    openGraph: {
      title: `${region.name} 청년이라면 2026년 월 최대 40만원 지원받는 법`,
      description: `신청 마감일·예산 소진율까지 실시간 확인`,
    }
  }
}
```

**페이지 섹션 순서 (반드시 이 순서 유지):**

```
┌─────────────────────────────────────────────────────┐
│  [SECTION 1: 히어로 헤더]                            │
│  H1: "{지역명} 청년이라면 2026년 지금 당장 받을 수    │
│       있는 복지 총정리"                              │
│  부제: "2026년 기준 · 오늘 {날짜} 업데이트"          │
│  강조 배지: "지금 신청 가능한 지원금 총액 월 최대     │
│             {총합금액}원"                            │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [SECTION 2: 긴박감 대시보드 ⚡ 재방문 핵심]          │
│  - 마감 임박 D-Day 카드 (7일 이내 마감, 최대 3개)    │
│  - 예산 소진율 바 (80% 이상 빨간색)                  │
│  - "이번 달 변경사항" (NEW + 변경 목록)              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [SECTION 3: 지역 복지 뉴스 📰 재방문 핵심]          │
│  - 제목: "오늘의 {지역명} 복지 소식"                  │
│  - articles 테이블 지역명 키워드 필터 최신 3건        │
│  - 기사 없으면 섹션 완전 숨김                         │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [SECTION 4: 핵심 지원 목록 💰 메인 킬러콘텐츠]       │
│  - 탭 필터: 현금 / 주거 / 취업 / 교육               │
│  - 기본 정렬: 마감일 임박순                           │
│  - PolicyCard 컴포넌트 목록                          │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [SECTION 5: 자격 빠른 확인 🔍 보조 판독기]          │
│  - "내가 받을 수 있는지 10초 확인"                   │
│  - 나이 슬라이더 + 소득 선택                          │
│  - 결과: 조건 맞는 정책 + 추가 추천 혜택             │
│  - 공유 버튼: 카카오톡 결과 카드 공유                 │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [SECTION 6: 지역 맥락 정보]                         │
│  - "{지역명} 1인 청년 평균 월세: 약 {N}만원"         │
│  - "이 지원금 받으면 실질 부담: 약 {M}만원"          │
│  - "담당: {local_office_name} ☎ {phone}"            │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [SECTION 7: 내부 링크 SEO 허브]                     │
│  - "서울 다른 지역도 확인하기" → 인접 구 3개         │
│  - "이 정책의 전국 비교" → 정책 상세 페이지           │
└─────────────────────────────────────────────────────┘
```

---

### 8-3. PolicyCard 컴포넌트 상세 명세

**파일:** `src/app/(public)/welfare/_components/PolicyCard.tsx`

```typescript
interface PolicyCardProps {
  policyName: string;
  supportAmount: number;        // 기본 지원금(원)
  localExtraAmount: number;     // 지자체 추가금(원)
  daysLeft: number | null;      // null = 상시
  budgetPercent: number;        // 0~100
  ageRange: string;             // "19~34세"
  incomeCriteria: string;
  residenceCriteria: string;
  applyUrl: string;
  applyMethod: string;
  isNew: boolean;
  changeLog?: { date: string; desc: string }[];
  dataSource: string;           // 출처 (근본이즘 원칙 준수)
}
```

**렌더링 규칙 (반드시 준수):**
- `daysLeft <= 7` → 🔴 빨간 배지 `D-${daysLeft} 마감 임박`
- `daysLeft <= 30` → 🟠 주황 배지 `D-${daysLeft}`
- `daysLeft === null` → 🟢 `상시접수`
- `budgetPercent >= 80` → `⚠️ 예산 ${budgetPercent}% 소진` 경고
- `isNew === true` → `🆕 NEW` 파란 배지
- 합산금액: `월 ${(supportAmount + localExtraAmount).toLocaleString()}원`
- 자격요건: **최대 3줄** (초과 시 "더보기" 처리)
- 출처: 카드 하단 작은 글씨로 `출처: {dataSource}` 필수 표시

---

### 8-4. DdayCounter 컴포넌트
```typescript
function calculateDday(endDate: string | null): number | null {
  if (!endDate) return null; // 상시
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  return diff; // 음수 = 마감된 정책 → PolicyCard 자동 숨김
}
```

---

## 9. SEO 완전 자동화 명세

### 9-1. generateStaticParams (100개 페이지 자동 생성)
```typescript
// /welfare/[region]/page.tsx
export async function generateStaticParams() {
  const supabase = createServerSupabaseClient();
  const { data: regions } = await supabase
    .from('welfare_regions')
    .select('slug')
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .limit(100);
  return regions?.map(r => ({ region: r.slug })) ?? [];
}

export const revalidate = 3600; // 1시간마다 자동 재생성 (D-Day 반영)
```

### 9-2. 구조화 데이터 (Schema.org FAQPage)
```typescript
// 각 pSEO 페이지에 JSON-LD 삽입 필수 (구글 Featured Snippet 선점)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": `${regionName} 청년 월세 지원 얼마나 받나요?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${regionName} 청년은 국가 지원 월 20만원 + 지역 자체 지원 최대 월 ${localAmount}원으로 최대 월 ${total}원을 받을 수 있습니다.`
      }
    },
    {
      "@type": "Question",
      "name": `${regionName} 청년 복지 신청 방법은?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "복지로(www.bokjiro.go.kr) 또는 온라인청년센터에서 온라인 신청 가능합니다."
      }
    }
  ]
};
```

### 9-3. sitemap.ts
```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: regions } = await supabase
    .from('welfare_regions')
    .select('slug, updated_at')
    .eq('is_active', true);

  return regions?.map(r => ({
    url: `https://thebok.co.kr/welfare/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'daily' as const, // D-Day가 매일 바뀌므로 daily
    priority: 0.9,
  })) ?? [];
}
```

### 9-4. 타겟 키워드 구조
```
헤드 키워드:  "[지역명] 청년 복지"
              "[지역명] 청년 지원금 2026"
롱테일 키워드: "[지역명] 청년 월세 지원 신청 방법"
              "[지역명] 청년 지원금 받을 수 있는지 확인"
              "[지역명] 청년 복지 마감일"
```

---

## 10. UI/UX 디자인 시스템

### 10-1. 디자인 철학
- **컨셉**: Glassmorphism + 다크 그라디언트 (2026 MZ 트렌드)
- **원칙**: 근본이즘 — 장식보다 정보 자체가 디자인
- **우선순위**: 모바일 퍼스트 (375px 기준)

### 10-2. 컬러 팔레트
```css
:root {
  /* 배경 */
  --welfare-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  
  /* 액션 컬러 */
  --accent-emergency: #e94560;   /* D-7 이내, CTA 버튼 */
  --accent-warning: #f5a623;     /* D-30 이내, 예산 경고 */
  --accent-safe: #27ae60;        /* 상시접수 */
  --accent-new: #3498db;         /* NEW 배지 */
  
  /* 카드 */
  --card-bg: rgba(255, 255, 255, 0.95);
  --card-bg-dark: rgba(30, 40, 60, 0.85);
  --card-border: rgba(255, 255, 255, 0.1);
  --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

### 10-3. 폰트
```typescript
// src/app/layout.tsx
import { Noto_Sans_KR } from 'next/font/google';
const font = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700', '900'] });
```

### 10-4. 핵심 애니메이션
```css
/* 예산 소진율 바 */
.budget-fill { transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1); }

/* PolicyCard 호버 */
.policy-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(233, 69, 96, 0.15);
  transition: all 0.25s ease;
}

/* NEW 배지 Pulse */
.badge-new { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

/* D-Day 긴급 배지 진동 */
.badge-emergency { animation: shake 0.5s ease-in-out; }

/* 숫자 카운트업 (히어로 총지원금) */
.count-up { animation: countUp 1.5s ease-out forwards; }
```

### 10-5. 모바일 필수 사항
- 모든 카드: `width: 100%`
- D-Day 카드 영역: `overflow-x: auto; display: flex; gap: 12px;` (가로 스크롤)
- "신청하기" CTA: 모바일에서 하단 Fixed 버튼 추가 배치
- 탭 메뉴: `overflow-x: auto` 수평 스크롤

---

## 11. 바이럴 루프 설계

### 11-1. 공유 카드 이미지 API
```
GET /api/welfare/og?region=gwanak-gu&amount=400000&name=김철수
```
- `@vercel/og` 로 서버 사이드 동적 이미지 실시간 생성
- 이미지 내용: "나는 {지역명}에서 월 {금액}원 받을 수 있어요" + THE복지 로고 워터마크
- 카카오톡 공유 시 이 이미지가 자동 썸네일로 노출

### 11-2. 공유 흐름
```
사용자: 자격 판독기 → 결과 확인
    ↓
"카카오톡으로 공유하기" 버튼 클릭
    ↓
카카오 SDK → /api/welfare/og 이미지 생성
    ↓
친구 피드에 "나 관악구 청년인데 월 40만원 받는다" 카드 노출
    ↓
친구 클릭 → THE복지 pSEO 페이지 방문 (바이럴 루프)
```

---

## 12. 완전 자동화 흐름

```
매일 새벽 03:00
  Cron Job → /api/welfare/sync 호출
        ↓
  공공 API (청년센터, 보조금24, 지자체) 데이터 수집
        ↓
  Gemini 1.5 Flash API → 지원금액, 마감일, 자격조건 자동 추출
        ↓
  품질 스코어 자동 계산 → 40점 미만 → is_indexed = false (noindex)
        ↓
  Supabase DB Upsert (변경 데이터만 update)
        ↓
  Next.js ISR revalidate(3600) → 모든 pSEO 페이지 자동 재생성
        ↓
  sitemap.xml changeFrequency=daily → 구글 크롤러 신호
        ↓
  구글 매일 크롤링 → 검색 결과 업데이트

대표님이 수동으로 해야 하는 유일한 작업:
  → 신규 정책 발표 시: welfare_policies 행 1개 추가
  → 이후 전국 모든 관련 지역 페이지 자동 반영 완료
```

---

## 13. 개발 실행 순서 (팀 체크리스트)

> [!IMPORTANT]
> 반드시 아래 순서대로 구현. 건너뛰면 빌드 오류 발생.

### Phase 1: DB 구축 및 데이터 시드 [Bee 담당]
- [ ] `welfare_regions` 테이블 생성 (SQL 5-1 실행)
- [ ] `welfare_policies` 테이블 생성 (SQL 5-2 실행)
- [ ] `welfare_region_policies` 테이블 생성 (SQL 5-3 실행)
- [ ] 서울 25개 구 시드 데이터 입력 (avg_rent_1room 포함)
- [ ] 전국 공통 핵심 정책 10개 수동 입력
- [ ] 지역-정책 매핑 데이터 입력

### Phase 2: 라우팅 기반 구축 [Eff 담당]
- [ ] 기존 `/welfare` 관련 파일 전면 삭제 (git에 삭제 커밋 필수)
- [ ] 새 디렉토리 구조 생성 (Section 4-2 기준)
- [ ] `generateStaticParams` + `revalidate = 3600` 구현
- [ ] 로컬 `npm run build` 정상 완료 확인

### Phase 3: 컴포넌트 구현 [Eff 담당]
- [ ] `PolicyCard.tsx` (배지 로직 포함, Section 8-3 기준)
- [ ] `DdayCounter.tsx` (자동 계산, Section 8-4 기준)
- [ ] `BudgetMeter.tsx` (소진율 바)
- [ ] `LocalNewsFeed.tsx` (articles 테이블 연동)
- [ ] `NewBadge.tsx`
- [ ] `WelfareHeroSection.tsx` (총지원금 자동 합산 표시)

### Phase 4: 데이터 파이프라인 [Bee 담당]
- [ ] `src/lib/welfare-data-factory.ts` 작성 (Gemini API 연동, Section 7-1 기준)
- [ ] `src/app/api/welfare/sync/route.ts` 배치 엔드포인트 작성
- [ ] 환경변수 추가: `GEMINI_API_KEY`
- [ ] 로컬 테스트: 관악구 1개 지역 데이터 자동 정제 확인

### Phase 5: SEO 완전 적용 [Eff 담당]
- [ ] `generateMetadata` 동적 생성 (Section 9-1 기준)
- [ ] JSON-LD FAQPage 구조화 데이터 삽입 (Section 9-2 기준)
- [ ] `sitemap.ts` welfare 경로 추가 (Section 9-3 기준)
- [ ] 각 페이지 H1·H2 계층 구조 검수

### Phase 6: UI/UX 스타일링 [Eff 담당]
- [ ] CSS 변수 (컬러 팔레트) 전역 적용 (Section 10-2 기준)
- [ ] 히어로 다크 그라디언트 배경
- [ ] Glassmorphism 카드 스타일
- [ ] 애니메이션 적용 (pulse, hover, budget-bar, count-up)
- [ ] 모바일 375px 기준 전 디바이스 대응 확인

### Phase 7: 허브 페이지 + 내부 링크 [Eff 담당]
- [ ] `/welfare` 허브 페이지 (서울 SVG 지도 + 카드 그리드)
- [ ] 인접 지역 내부 링크 자동 생성 로직

### Phase 8: 바이럴 기능 [Bee + Eff 담당]
- [ ] `WelfareCalculator.tsx` (자격 판독기)
- [ ] `/api/welfare/og` 공유 카드 이미지 생성 API
- [ ] 카카오톡 공유 SDK 연동

### Phase 9: 검증 및 배포 [전체]
- [ ] `npm run build` 오류 없이 완료
- [ ] Vercel 배포 및 ISR 1시간 동작 실제 확인
- [ ] 구글 Search Console sitemap.xml 제출
- [ ] 대표 5개 페이지 모바일 렌더링 확인
- [ ] 품질 스코어 40점 미만 페이지 noindex 처리 동작 확인

---

## 14. 기술적 주의사항 모음

> [!IMPORTANT]
> **공공 API**: `serviceKey`는 반드시 `encodeURIComponent()` 적용. 미적용 시 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`.

> [!IMPORTANT]
> **Supabase 어드민 작업**: 데이터 수정·삽입·삭제는 반드시 `adminSupabase` 클라이언트 사용. 일반 클라이언트는 RLS로 인해 `403` 반환.

> [!IMPORTANT]
> **Phase 1 → Phase 2 의존**: `welfare_regions`에 데이터 없으면 `generateStaticParams`가 빈 배열 반환 → 0개 페이지 빌드. 반드시 DB 시드 완료 후 라우팅 구현.

> [!CAUTION]
> **기존 welfare 삭제**: 삭제 전 현재 `/welfare` 경로 사용 파일 목록 확인. 삭제 후 복구 불가. 반드시 git commit 후 삭제.

> [!NOTE]
> **ISR 주의**: `revalidate = 3600` 설정 시, Vercel 무료 플랜은 ISR 기능이 제한될 수 있음. Pro 플랜 확인 필요.

> [!NOTE]
> **Gemini API Rate Limit**: 무료 티어는 분당 15회. 배치 처리 시 정책 100개를 처리하는 데 약 7분 소요. 새벽 배치이므로 문제 없음.

---

## 15. 대표님께 요청하는 사항 (개발 착수 전 확인)

> [!IMPORTANT]
> 아래 2가지를 확인해 주시면 바로 Phase 1 개발을 시작합니다.

### 요청 1: Gemini API 키 발급
1. [Google AI Studio](https://aistudio.google.com/) 접속
2. 우측 상단 "Get API Key" 클릭 → 무료 발급
3. 발급된 키를 `GEMINI_API_KEY=your_key_here` 형태로 전달

### 요청 2: 서울 열린데이터 광장 API 키 발급 (선택사항)
1. [data.seoul.go.kr](https://data.seoul.go.kr) 회원가입
2. "인증키 발급" 메뉴에서 발급 신청
3. 발급된 키 전달 (없어도 정적 배열로 대체 가능, 선택)

---

*작성: 2026-04-17 | PM Jay*  
*다음 단계: 대표님 API 키 전달 및 승인 → Bee(비) Phase 1 DB 구축 시작*
