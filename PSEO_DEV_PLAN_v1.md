# THE복지 pSEO 킬러콘텐츠 개발 계획안 v1
> 작성일: 2026-04-17 | 작성자: PM Jay | 상태: 승인 대기
> **절대 덮어쓰기 금지. 수정 시 v2, v3으로 버전 업 필수.**

---

## 0. 이 문서의 목적

저사양 모델(Gemini 3 Flash)이 이 문서 하나만 읽고 **추가적인 질문 없이** 100% 구현할 수 있도록 작성된 완전 명세서다. 기존 welfare 관련 모든 페이지(`src/app/(public)/welfare/`)는 **전면 폐기**하고 이 계획안 기반으로 신규 구축한다.

---

## 1. 프로젝트 목적 및 핵심 목표

### 1-1. 3가지 핵심 목표 (검증 대상)
1. **트래픽 검증**: Zapier처럼 pSEO 페이지를 구축하여 실제 오가닉 검색 트래픽을 모을 수 있는가?
2. **재방문율 검증**: 방문자가 실질적이고 정확한 도움을 받아 재방문율이 올라가는가?
3. **바이럴 검증**: 양질의 콘텐츠로 방문자가 자연스럽게 지인에게 공유하여 추가 트래픽이 발생하는가?

### 1-2. MVP 범위
- **대상 지역**: 서울/수도권 우선 (서울 25개 구 + 경기 주요 시)
- **목표 페이지 수**: 약 100개 (지역 × 정책 조합)
- **타겟 사용자**: 19~34세 청년 (개인주의·초효율·근본이즘 특성)

### 1-3. 성공 기준 (KPI)
- pSEO 페이지 구글 색인 수: 100개
- 월 오가닉 방문자: 1,000명 이상 (3개월 후)
- 페이지당 평균 체류시간: 2분 이상
- 특정 페이지 재방문율: 20% 이상

---

## 2. 콘텐츠 전략 (브레인스토밍 최종 결론)

### 2-1. 메인 콘텐츠: "지역별 청년 복지 완전 가이드"

**페이지 제목 공식:**
```
[지역명] 청년이라면 2026년 지금 당장 받을 수 있는 복지 총정리
```
예시: `관악구 청년이라면 2026년 지금 당장 받을 수 있는 복지 총정리`

**이유:**
- MZ세대는 타인 비교보다 "내가 받을 수 있는가"에 관심 → 개인 직결형 콘텐츠
- 이 문장이 실제 청년들의 검색어와 일치
- 긴 글 없이 정책 목록을 스캔하는 초효율 소비 패턴에 최적화

### 2-2. 정보 계층 구조

**Layer 1 (X축 - 메인 pSEO 페이지):** 지역별 완전 가이드
```
URL: /welfare/[region-slug]
예시: /welfare/gwanak-gu
```

**Layer 2 (Z축 - 서브 pSEO 페이지):** 정책별 상세 (내부 링크)
```
URL: /welfare/[region-slug]/[policy-slug]
예시: /welfare/gwanak-gu/monthly-rent-support
```

### 2-3. 보조 콘텐츠 (재방문 유도 엔진 - 핵심)

**① D-Day 카운터** (매일 자동 변경)
- 신청 마감일까지 남은 일수 자동 계산
- "D-17" → "D-16" → 매일 바뀜 → 페이지가 살아있음을 자동 증명
- 마감일 없는 상시 정책은 예산 소진율로 대체

**② 예산 소진율** (긴박감 생성)
- `현재 78% 소진 (잔여 예산 약 2,200만원 추정)` 표시
- 소진율이 높을수록 빨간색 → 손실 회피 심리 자극

**③ 지역 복지 뉴스 피드** (매일 자동 갱신)
- 해당 지역명 + 청년 키워드로 필터링된 THE복지 최신 기사
- 매일 새 기사가 붙어 "오늘도 업데이트됨" 인식 자동 생성
- THE복지가 미디어사이므로 가장 자연스러운 콘텐츠 포맷

**④ NEW 배지 시스템**
- 지난 30일 내 신설·변경된 정책에 🆕 자동 배지
- `신설 (2026.04.01)`, `조건 완화 (2026.03.15)` 형태
- 재방문 시 "저번엔 없었던 게 생겼네" 인식 유도

### 2-4. 판독기(Calculator) - 보조 도구 (메인 아님)
- 페이지 하단 보조 섹션으로 배치
- B+C 혼합 방식: "내 상황 빠르게 확인" + "다른 받을 수 있는 혜택 자동 추천"
- 결과는 공유 가능한 이미지 카드로 렌더링 (바이럴 유도)
- 1회성 사용이 단점이므로 절대 메인 콘텐츠 위치에 두지 말 것

---

## 3. URL 구조 및 라우팅 설계

### 3-1. 전체 디렉토리 구조 (신규 생성)
```
src/app/(public)/welfare/
├── page.tsx                          # /welfare (지역 선택 허브 페이지)
├── [region]/
│   ├── page.tsx                      # /welfare/[region] (지역별 메인 가이드)
│   └── [policy]/
│       └── page.tsx                  # /welfare/[region]/[policy] (정책 상세)
└── _components/
    ├── WelfareHeroSection.tsx
    ├── PolicyCard.tsx
    ├── DdayCounter.tsx
    ├── BudgetMeter.tsx
    ├── LocalNewsFeed.tsx
    ├── NewBadge.tsx
    ├── WelfareCalculator.tsx
    └── ShareCard.tsx
```

### 3-2. generateStaticParams 구현 명세 (100% 자동화 핵심)

**`/welfare/[region]/page.tsx` 에 반드시 포함:**
```typescript
export async function generateStaticParams() {
  const supabase = createServerSupabaseClient(); // 기존 서버 클라이언트 사용
  const { data: regions } = await supabase
    .from('welfare_regions')
    .select('slug')
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .limit(100);

  return regions?.map(r => ({ region: r.slug })) ?? [];
}

export const revalidate = 3600; // 1시간마다 자동 재생성 (D-Day 변경 반영)
```

---

## 4. Supabase DB 스키마 설계 (신규 테이블 3개)

> [!IMPORTANT]
> 아래 3개 테이블을 반드시 이 순서대로 생성할 것. 외래키 관계 때문에 순서 변경 불가.

### 4-1. `welfare_regions` 테이블 (1번째 생성)
```sql
CREATE TABLE welfare_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,              -- "관악구"
  name_en TEXT NOT NULL,           -- "Gwanak-gu"
  slug TEXT UNIQUE NOT NULL,       -- "gwanak-gu"
  city TEXT NOT NULL,              -- "서울특별시"
  region_type TEXT NOT NULL,       -- "gu" | "si" | "gun"
  population_youth INTEGER,        -- 청년 인구 수
  avg_rent_1room INTEGER,          -- 1인실 평균 월세 (원), 예: 600000
  local_office_phone TEXT,         -- 지역 복지관 전화번호
  local_office_name TEXT,          -- "관악구청 청년정책과"
  priority INTEGER DEFAULT 0,      -- 노출 우선순위 (낮을수록 먼저)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-2. `welfare_policies` 테이블 (2번째 생성)
```sql
CREATE TABLE welfare_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,                 -- "청년 월세 한시 특별지원"
  policy_type TEXT NOT NULL,          -- "national" | "local"
  category TEXT NOT NULL,             -- "housing" | "employment" | "education" | "living"

  -- 지원 내용
  support_amount INTEGER,             -- 월 지원금액(원), 예: 200000
  support_duration TEXT,              -- "최대 12개월"
  support_description TEXT NOT NULL,

  -- 자격 요건 (3줄 이내 강제)
  age_min INTEGER DEFAULT 19,
  age_max INTEGER DEFAULT 34,
  income_criteria TEXT,               -- "중위소득 60% 이하"
  residence_criteria TEXT,            -- "해당 지역 거주 6개월 이상"
  other_criteria TEXT,

  -- 신청 정보
  apply_url TEXT,
  apply_method TEXT,                  -- "온라인" | "방문" | "우편"
  apply_start_date DATE,
  apply_end_date DATE,                -- NULL이면 상시

  -- 예산 정보 (재방문 유도 핵심 데이터)
  total_budget BIGINT,
  used_budget BIGINT DEFAULT 0,
  total_quota INTEGER,
  current_applicants INTEGER DEFAULT 0,

  -- 메타
  is_new BOOLEAN DEFAULT false,
  new_until DATE,                     -- NEW 배지 표시 마감일
  change_log JSONB DEFAULT '[]',      -- [{"date":"2026-04-01","desc":"조건 완화"}]
  is_active BOOLEAN DEFAULT true,
  data_source TEXT,                   -- "보조금24 API" | "지자체 공홈" | "수동"
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-3. `welfare_region_policies` 테이블 (3번째 생성)
```sql
CREATE TABLE welfare_region_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID REFERENCES welfare_regions(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES welfare_policies(id) ON DELETE CASCADE,

  -- 지역 고유 데이터 (전국 정책에 지역 특수 조건 추가)
  local_extra_amount INTEGER DEFAULT 0,  -- 지자체 자체 추가 지원금
  local_condition TEXT,                   -- 지역 특수 완화 조건
  local_office_name TEXT,
  local_office_phone TEXT,
  local_apply_url TEXT,

  priority INTEGER DEFAULT 0,
  UNIQUE(region_id, policy_id)
);
```

### 4-4. 초기 시드 데이터 전략
- 서울 25개 구: `welfare_regions`에 1회 수동 입력
- 전국 공통 정책 5~10개: `welfare_policies`에 1회 수동 입력
- 지역-정책 매핑: `welfare_region_policies`에 입력
- **이후 유지보수**: 정책 업데이트 시 해당 테이블 1행만 수정 → 전 지역 페이지 자동 반영

---

## 5. 공공 API 연동 명세

### 5-1. 연동 우선순위 (MVP 단계)

| 우선순위 | API명 | 용도 |
|---------|-------|------|
| 1순위 | 청년정책 API (data.go.kr) | 청년 특화 정책 목록 |
| 2순위 | 보조금24 API | 전국 공통 복지 정책 |
| 3순위 | 지자체복지서비스 API | 지역 고유 사업 |
| 후순위 | 한국부동산원 월세 동향 | 지역 평균 월세 |

### 5-2. API 호출 필수 규칙
```typescript
// src/lib/welfare-api.ts (신규 생성)
export async function fetchYouthPolicies(region: string) {
  // ⚠️ 반드시 encodeURIComponent 적용 - 미적용 시 SERVICE_KEY_IS_NOT_REGISTERED_ERROR
  const encodedKey = encodeURIComponent(process.env.PUBLIC_DATA_API_KEY!);
  const url = `${API_BASE}?serviceKey=${encodedKey}&region=${encodeURIComponent(region)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  return res.json();
}
```

### 5-3. MVP 데이터 전략
> API 연동이 복잡할 경우 초기 MVP는 수동 데이터로 시작. DB 스키마는 API 연동을 염두에 두고 위 설계 그대로 유지.

---

## 6. 페이지별 UI 상세 명세

### 6-1. 허브 페이지 `/welfare`

**SEO:**
```typescript
export const metadata = {
  title: '서울/수도권 청년 복지 지역별 총정리 2026 | THE복지',
  description: '관악구, 마포구, 강남구 등 서울 25개 구 청년이라면 받을 수 있는 복지 지원금 지역별 완전 총정리',
}
```

**화면 구성:**
- 인터랙티브 서울 지도 SVG (구 클릭 → 해당 pSEO 페이지 이동)
- 지역 카드 그리드 25개 (구명 + "최대 월 N만원" 표시)

---

### 6-2. 메인 pSEO 페이지 `/welfare/[region]`

**동적 SEO:**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const region = await getRegionBySlug(params.region);
  return {
    title: `${region.name} 청년 복지 2026 완전 총정리 | THE복지`,
    description: `${region.name} 청년이라면 지금 당장 받을 수 있는 복지 지원금 총정리. 청년 월세지원, 내일저축계좌, ${region.name} 자체 지원까지. 신청 방법·마감일 포함.`,
    keywords: [`${region.name} 청년 복지`, `${region.name} 청년 지원금`, `${region.name} 청년 월세`],
    openGraph: {
      title: `${region.name} 청년이라면 지금 월 최대 40만원 지원받는 법`,
    }
  }
}
```

**페이지 섹션 순서 (반드시 이 순서 유지):**

```
[Section 1 - 히어로 헤더]
H1: "{지역명} 청년이라면 2026년 지금 당장 받을 수 있는 복지 총정리"
부제: "2026년 기준 · 오늘 {날짜} 업데이트"
배지: "국가 + 지역 합산 최대 월 40만원"

[Section 2 - 긴박감 대시보드 ⚡ 재방문 핵심]
- 마감 임박 D-Day 카드 (7일 이내 마감 정책, 최대 3개)
- 예산 소진율 바 (80% 이상 빨간색)
- "이번 달 변경사항" (NEW 배지 + 변경 목록)

[Section 3 - 지역 복지 뉴스 📰 재방문 핵심]
- 제목: "오늘의 {지역명} 복지 소식"
- articles 테이블에서 지역명 키워드 필터 최신 3건
- 기사 없으면 이 섹션 완전 숨김

[Section 4 - 핵심 지원 목록 💰 메인 킬러콘텐츠]
- 탭 필터: 현금 / 주거 / 취업 / 교육
- 기본 정렬: 마감일 임박순
- PolicyCard 컴포넌트 목록

[Section 5 - 자격 빠른 확인 🔍 보조 도구]
- "내가 받을 수 있는지 10초 확인"
- 나이 슬라이더 + 소득 선택 입력
- 결과: 해당 정책 + 추가 받을 수 있는 혜택 자동 추천
- 공유 버튼: 카카오톡 결과 카드 공유

[Section 6 - 지역 정보]
- "{지역명} 1인 청년 평균 월세: 약 {avg_rent}만원"
- "이 지원금 받으면 실질 부담: 약 {net}만원"
- "담당: {local_office_name} ☎ {phone}"

[Section 7 - 내부 링크 (SEO 권위 분산)]
- "서울 다른 지역도 확인하기" → 인접 구 3개 링크
- "이 정책 전국 비교" → 정책 상세 페이지 링크
```

---

### 6-3. PolicyCard 컴포넌트 상세 명세

**파일:** `src/app/(public)/welfare/_components/PolicyCard.tsx`

```typescript
interface PolicyCardProps {
  policyName: string;
  supportAmount: number;       // 기본 지원금(원)
  localExtraAmount: number;    // 지자체 추가금(원)
  daysLeft: number | null;     // null = 상시
  budgetPercent: number;       // 0~100
  ageRange: string;            // "19~34세"
  incomeCriteria: string;
  residenceCriteria: string;
  applyUrl: string;
  applyMethod: string;
  isNew: boolean;
  changeLog?: string;
}
```

**렌더링 규칙 (반드시 준수):**
- `daysLeft !== null && daysLeft <= 7` → 빨간 배지 `🔴 D-${daysLeft} 마감 임박`
- `daysLeft !== null && daysLeft <= 30` → 주황 배지 `🟠 D-${daysLeft}`
- `daysLeft === null` → 초록 배지 `🟢 상시접수`
- `budgetPercent >= 80` → `⚠️ 예산 ${budgetPercent}% 소진` 경고 표시
- `isNew === true` → `🆕 NEW` 파란 배지
- 합산금액 표시: `월 ${(supportAmount + localExtraAmount).toLocaleString()}원`
- 자격요건: **최대 3줄** (MZ 초효율 원칙, 넘으면 "..." 처리 후 펼치기)

---

### 6-4. DdayCounter 컴포넌트

```typescript
// src/app/(public)/welfare/_components/DdayCounter.tsx
function calculateDday(endDate: string | null): number | null {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}
// 반환값 < 0: 마감된 정책 → PolicyCard 자동 숨김 처리
// 반환값 === 0: "오늘 마감" 강조
```

---

### 6-5. LocalNewsFeed 컴포넌트

```typescript
// 기존 articles 테이블에서 지역명 키워드 필터링
const { data: news } = await supabase
  .from('articles')
  .select('id, title, created_at, slug')
  .or(`title.ilike.%${regionName}%,content.ilike.%${regionName}%`)
  .order('created_at', { ascending: false })
  .limit(3);

// news.length === 0 이면 이 섹션 렌더링하지 않을 것
```

---

## 7. SEO 완전 자동화 명세

### 7-1. 타겟 키워드 구조
```
메인: "[지역명] 청년 복지" / "[지역명] 청년 지원금 2026"
롱테일: "[지역명] 청년 월세 지원 신청 방법" / "[지역명] 청년 지원금 받을 수 있는지"
```

### 7-2. 구조화 데이터 (Schema.org FAQPage)
```typescript
// 각 pSEO 페이지 에 JSON-LD 삽입 필수
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
    }
  ]
};

// 페이지 내 삽입:
// <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
```

### 7-3. sitemap.ts 업데이트
```typescript
// src/app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: regions } = await supabase
    .from('welfare_regions')
    .select('slug, updated_at')
    .eq('is_active', true);

  const welfarePaths = regions?.map(r => ({
    url: `https://thebok.co.kr/welfare/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'daily' as const, // D-Day가 매일 바뀌므로 daily
    priority: 0.9,
  })) ?? [];

  return [...welfarePaths]; // 기존 sitemap 항목과 합산
}
```

---

## 8. UI/UX 디자인 시스템

### 8-1. 디자인 방향
- **컨셉**: Glassmorphism + 다크 그라디언트 (2026 MZ 트렌드)
- **원칙**: 근본이즘 — 장식보다 정보 자체가 디자인
- **우선순위**: 모바일 퍼스트 (375px 기준)

### 8-2. 컬러 팔레트
```css
--welfare-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
--accent-emergency: #e94560;   /* D-7 이내, CTA */
--accent-warning: #f5a623;     /* D-30 이내 */
--accent-safe: #27ae60;        /* 상시접수 */
--accent-new: #3498db;         /* NEW 배지 */
--card-bg: rgba(255,255,255,0.95);
--card-border: rgba(255,255,255,0.1);
```

### 8-3. 폰트
```typescript
// src/app/layout.tsx 에 추가
import { Noto_Sans_KR } from 'next/font/google';
const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], weight: ['400','500','700'] });
```

### 8-4. 핵심 애니메이션
```css
/* 예산 소진율 바 */
.budget-fill { transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1); }

/* PolicyCard 호버 */
.policy-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(233,69,96,0.15); transition: all 0.2s; }

/* NEW 배지 */
.badge-new { animation: pulse 2s infinite; }

/* 긴급 D-Day */
.badge-emergency { animation: shake 0.5s ease-in-out; }
```

### 8-5. 모바일 필수 사항
- 전 카드: `width: 100%`
- D-Day 카드들: `overflow-x: auto; display: flex; gap: 12px;`
- "신청하기" CTA: 하단 fixed position 추가 버튼 배치
- 탭 메뉴: `overflow-x: auto` 수평 스크롤

---

## 9. 완전 자동화 흐름

```
[대표님: Supabase DB 정책 정보 1건 업데이트]
          ↓
[Next.js ISR: 1시간마다 자동 revalidate]
          ↓
[generateStaticParams: 100개 페이지 자동 재생성]
          ↓
[각 페이지: 최신 D-Day·예산·뉴스·NEW배지 자동 반영]
          ↓
[sitemap.xml: changeFrequency=daily로 구글 크롤러 신호]
          ↓
[구글: 매일 크롤링 → 색인 업데이트]
```

**대표님이 수동으로 해야 할 유일한 작업:**
- 신규 정책 발표 시: `welfare_policies` 테이블에 행 1개 추가
- 정책 조건 변경 시: 해당 행 수정
- 이후 전국 모든 관련 지역 페이지 자동 반영됨

---

## 10. 바이럴 루프 설계

### 10-1. 공유 카드 API
```
GET /api/welfare/og?region=gwanak-gu&amount=400000
```
- `@vercel/og` 또는 `next/og`로 동적 이미지 생성
- 이미지 내용: "나는 {지역명}에서 월 {금액}원 지원받을 수 있어요" + THE복지 로고 워터마크
- 카카오톡 공유 시 이 이미지가 자동 썸네일 표시

### 10-2. 공유 버튼 위치
- 자격 판독기 결과 화면 하단
- "내 결과 공유하기 → 카카오톡" 버튼

---

## 11. 개발 실행 순서 (저사양 모델 구현 체크리스트)

> [!IMPORTANT]
> 반드시 아래 순서대로 구현. 건너뛰면 빌드 오류 발생.

### Phase 1: DB 구축 (Supabase)
- [ ] `welfare_regions` 테이블 생성
- [ ] `welfare_policies` 테이블 생성
- [ ] `welfare_region_policies` 테이블 생성
- [ ] 서울 25개 구 시드 데이터 삽입
- [ ] 핵심 정책 10개 시드 데이터 삽입
- [ ] 지역-정책 매핑 데이터 삽입

### Phase 2: 라우팅 기반 구축
- [ ] 기존 `/welfare` 관련 파일 전면 삭제
- [ ] 새 디렉토리 구조 생성
- [ ] `generateStaticParams` + `revalidate = 3600` 구현
- [ ] 로컬 빌드 정상 완료 확인

### Phase 3: 컴포넌트 구현
- [ ] `PolicyCard.tsx` (배지 로직 포함)
- [ ] `DdayCounter.tsx` (자동 계산)
- [ ] `BudgetMeter.tsx` (소진율 바)
- [ ] `LocalNewsFeed.tsx` (articles 테이블 연동)
- [ ] `NewBadge.tsx`

### Phase 4: SEO 적용
- [ ] `generateMetadata` 동적 생성
- [ ] JSON-LD FAQPage 구조화 데이터
- [ ] `sitemap.ts` welfare 경로 추가
- [ ] H1·H2 계층 구조 점검

### Phase 5: UI/UX 스타일링
- [ ] CSS 변수 (컬러 팔레트) 적용
- [ ] 히어로 그라디언트 배경
- [ ] Glassmorphism 카드 스타일
- [ ] 애니메이션 적용 (pulse, hover, budget-bar)
- [ ] 모바일 100% 대응

### Phase 6: 허브 페이지 + 내부 링크
- [ ] `/welfare` 허브 페이지 (지역 카드 그리드)
- [ ] 인접 지역 내부 링크 자동 생성

### Phase 7: 자격 판독기 + 공유 카드
- [ ] `WelfareCalculator.tsx`
- [ ] `/api/welfare/og` 공유 카드 API
- [ ] 카카오톡 공유 SDK 연동

### Phase 8: 검증 및 배포
- [ ] `npm run build` 오류 없이 완료 확인
- [ ] Vercel 배포 및 ISR 동작 확인
- [ ] 구글 Search Console sitemap 제출
- [ ] 5개 대표 페이지 모바일 렌더링 확인

---

## 12. 기술적 주의사항

> [!IMPORTANT]
> **공공 API**: `serviceKey`는 반드시 `encodeURIComponent()` 적용. 미적용 시 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`.

> [!IMPORTANT]
> **Supabase 관리자 작업**: 데이터 수정은 반드시 `adminSupabase` 클라이언트 사용. 일반 클라이언트는 `403`.

> [!CAUTION]
> **기존 welfare 삭제**: 삭제 전 현재 `/welfare` 경로 사용 파일 목록 확인 후 삭제. 복구 불가.

> [!NOTE]
> **Phase 1 → Phase 2 의존**: `welfare_regions`에 데이터 없으면 `generateStaticParams`가 빈 배열 반환 → 빌드 실패. 반드시 DB 시드 완료 후 라우팅 구현.

---

## 13. 파일 유실 방지 규칙

- **이 파일(PSEO_DEV_PLAN_v1.md)은 절대 삭제·덮어쓰기 금지**
- 수정 사항 발생 시 `PSEO_DEV_PLAN_v2.md`로 신규 파일 생성
- 브레인스토밍 원본: NotebookLM `the복지 킬러콘텐츠 브레인스토밍` 노트 보존
- 이 파일의 복사본을 `/welfare-press/PSEO_DEV_PLAN_v1.md` 경로에도 저장할 것

---

*작성: 2026-04-17 | PM Jay*
*다음 단계: 대표님 최종 승인 → Kay(케이) PRD 작성 → Bee(비) DB 구축 시작*
