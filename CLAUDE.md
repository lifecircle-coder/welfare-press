# THE복지 (thebok.co.kr) — Claude 작업 가이드

> 이 파일은 Claude Code가 매 대화마다 자동으로 읽는 프로젝트 컨텍스트 문서입니다.
> 작업 완료 시마다 이 파일의 관련 섹션을 최신 상태로 업데이트합니다.

---

## 🚨 절대 준수 규칙 (반드시 먼저 읽을 것)

1. **요청한 것만 수정한다** — 내가 지시한 파일·기능 외에는 절대 건드리지 않는다.
2. **기존 기능을 보호한다** — 수정 전 반드시 영향 범위를 분석하고, 잘 작동하는 코드를 건드려서 새 오류를 만들지 않는다.
3. **수정 전 전수조사** — 관련 파일을 모두 읽은 뒤 작업한다. 추측으로 코드를 작성하지 않는다.
4. **한 번에 완료** — 반복 오류를 최소화하고 요청 사항을 한 번에 완성한다.
5. **실서버 기준** — 로컬 통과가 완료 기준이 아니다. GitHub push → Vercel 자동 배포 후 실서버(`thebok.co.kr`)에서 확인해야 완료다.
6. **작업 완료 시 이 파일 업데이트** — 작업 내역, 롤백 포인트를 반드시 기록한다.
7. **직접 요청** — 내가 직접 하면 더 빠른 일(GitHub 인증, Supabase SQL 실행 등)은 바로 요청한다.

---

## ⚙️ 작업 워크플로우 (토큰 효율 & 고퀄리티 기준)

### Plan Mode — 승인 후 실행 원칙

복잡하거나 영향 범위가 큰 작업은 **반드시 Plan Mode로 계획을 먼저 제시하고 승인을 받은 뒤 실행**한다.
내가 승인("진행해", "OK", "맞아" 등)하기 전까지 코드를 작성하거나 파일을 수정하지 않는다.

```
[작업 요청] → [Plan 작성 & 보고] → [승인] → [실행] → [결과 보고] → [CLAUDE.md 업데이트]
```

### 작업 난이도별 접근법 (토큰 최적화)

| 난이도 | 해당 작업 | 접근법 |
|--------|----------|--------|
| 🔴 **고난도** | 아키텍처 변경, DB 스키마 수정, 신규 기능 설계, 복잡한 버그 | `/advisor` 활성화 + Plan Mode → 승인 후 실행 |
| 🟡 **중난도** | 기존 컴포넌트 수정, API 연동, 스타일 대규모 변경 | Plan Mode → 영향 범위 보고 → 승인 후 실행 |
| 🟢 **단순** | 텍스트 수정, CSS 미세 조정, 오타 수정 | 바로 실행 후 결과 보고 |

### /advisor 어드바이저 (Sonnet + Opus 듀얼 모델)

고난도 작업 시 `/advisor` 를 사용하면 **Sonnet이 실행, Opus가 전략 조언**하는 듀얼 모델로 동작한다.

- **사용법**: 고난도 작업 시작 전 `/advisor` 입력
- **효과**: Sonnet 단독 대비 성능 향상, Opus 단독 대비 비용 약 12% 절감
- **Opus가 자동 개입하는 시점**: 파일 탐색 완료 후 방향 설정, 막힌 문제 돌파, 작업 완료 직전 검증
- **적합한 작업**: 신규 기능 설계, 복잡한 버그 분석, DB 스키마 변경, 컴포넌트 리팩토링

### MCP 활용 원칙

| 상황 | 사용할 MCP |
|------|-----------|
| Next.js / Supabase 문법·API 확인 | **Context7 MCP** (공식 문서 기반, 추측 코드 금지) |
| DB 스키마 조회 / SQL 실행 | **Supabase MCP** (읽기 전용 확인 후 수정) |
| 복잡한 문제 단계적 분석 | **Sequential Thinking MCP** |

### 승인 없이 절대 진행 금지하는 작업

- DB 스키마 변경 (ALTER TABLE, 컬럼 추가/삭제)
- 기존에 잘 작동하는 페이지/컴포넌트의 구조적 리팩토링
- 환경변수 또는 설정 파일 변경
- 신규 라이브러리 설치

---

## 🏗️ 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | THE복지 |
| 도메인 | https://thebok.co.kr |
| 형태 | 복지 전문 인터넷 언론사 |
| 로컬 실행 | `npm run dev` → http://localhost:3000 |

---

## 🛠️ 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS, Framer Motion |
| DB / Auth | Supabase (PostgreSQL + Auth) |
| 에디터 | react-quill |
| 드래그앤드롭 | @dnd-kit |
| AI | @google/generative-ai (Gemini) |
| 이미지 최적화 | sharp, Supabase Image Transform API |
| 배포 | Vercel (GitHub main 브랜치 push → 자동 배포) |
| 도메인 | 가비아 |

---

## 📁 디렉토리 구조

```
welfare-press/
├── src/
│   ├── app/
│   │   ├── (public)/          # 퍼블릭 페이지
│   │   │   ├── page.tsx       # 홈
│   │   │   ├── article/[id]/  # 기사 상세
│   │   │   ├── news/[category]/ # 카테고리별 뉴스
│   │   │   ├── search/        # 검색
│   │   │   ├── policy/[type]/ # 이용약관, 개인정보처리방침
│   │   │   ├── login/         # 로그인
│   │   │   └── mypage/        # 마이페이지
│   │   ├── admin/             # 관리자 페이지
│   │   │   ├── page.tsx       # 대시보드
│   │   │   ├── articles/      # 기사 관리 (작성/수정/삭제)
│   │   │   ├── users/         # 기자 계정 관리
│   │   │   ├── menus/         # 메뉴 관리 (DnD 트리)
│   │   │   ├── inquiries/     # 문의 관리
│   │   │   └── partnerships/  # 제휴 문의 관리
│   │   └── api/
│   │       ├── optimize-image/ # 이미지 최적화 API
│   │       └── public-data/   # 공공데이터 API 프록시
│   ├── components/
│   │   ├── admin/             # 관리자 전용 컴포넌트
│   │   ├── welfare/           # 복지 기능 (계산기, AI 진단 등)
│   │   ├── home/              # 홈 전용 (HeroSection, LatestNews)
│   │   ├── article/           # 기사 관련 (댓글, 조회수)
│   │   ├── layout/            # 공통 레이아웃 (Header, Footer)
│   │   └── common/            # 공용 컴포넌트 (SafeImage 등)
│   ├── lib/
│   │   ├── supabaseClient.ts  # Supabase 클라이언트 (public/admin 분리)
│   │   ├── services.ts        # DB CRUD 서비스 레이어
│   │   ├── api/publicData.ts  # 공공데이터 API 연동
│   │   └── utils.ts           # 유틸리티 함수
│   └── types/                 # TypeScript 타입 정의
├── public/                    # 정적 파일
├── supabase/                  # Supabase 마이그레이션
├── CLAUDE.md                  # ← 현재 파일
└── .env.local                 # 환경변수 (git 제외)
```

---

## 🔐 핵심 아키텍처 규칙

### Supabase 클라이언트 분리 (절대 혼용 금지)
```typescript
// lib/supabaseClient.ts
supabase      // 퍼블릭(홈페이지) 전용 — storageKey: 'sb-public-auth'
adminSupabase // 관리자 전용 — RLS 우회, persistSession: false
```
- **관리자 페이지/기능**에서는 반드시 `adminSupabase` 명시적 주입
- `VisitorTracker.tsx`는 `/admin` 경로 진입 시 즉시 실행 중단 (세션 오염 방지)

### 발행일(date) 보호 (절대 변경 금지)
- `date` 필드는 기사 최초 발행 시점의 고유값
- 기사 수정 시 절대 변경되지 않아야 함
- 관리자 UI에서 발행일은 `readOnly` 상태 유지

### 이미지 처리 규칙
- 에디터에 붙여넣은 이미지 → Canvas로 1200px 리사이징 → WebP 변환 → Supabase Storage 저장 → URL 링크로 교체
- Base64 이미지를 DB에 직접 저장하지 않는다 (Vercel 4.5MB 제한 우회)
- `SafeImage.tsx`는 Supabase Image Transformation API(`render/image`) 연동으로 실시간 리사이징

### UI 표준
- **최대 가로폭**: 1280px (네이버 표준, 포털 사이트 기준)
- **반응형**: 1280px 미만 → Fluid(유동형) 방식
- **날짜 표시**: `toLocaleString('ko-KR')` (초 단위까지)
- **에디터 인라인 스타일**: 실시간 렌더링 및 스타일 보존을 위해 인라인 스타일 방식 사용

### 성능
- `created_at` 인덱스: `idx_articles_created_at` (생성 완료)
- 본문에 대용량 Base64 이미지 삽입 금지

---

## 🔑 환경변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>          # .env.local 참조
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>       # .env.local 참조 (절대 커밋 금지)

# 공공데이터 API 키
NEXT_PUBLIC_DATA_API_KEY=<group-a-key>             # 기업형 (Group A)
NEXT_PUBLIC_GENERAL_DATA_API_KEY=<group-b-key>     # 일반형 (Group B)
```

---

## 📡 공공데이터 API 키 정책

### Group A — 기업형 인증키 (`NEXT_PUBLIC_DATA_API_KEY`)
| API | 상태 |
|-----|------|
| 한국사회보장정보원_중앙부처복지서비스 | ✅ 정상 |
| 한국사회보장정보원_지자체복지서비스 | ✅ 정상 |
| 여성가족부_정책뉴스(MOGEF) | ✅ 정상 |

### Group B — 일반형 인증키 (`NEXT_PUBLIC_GENERAL_DATA_API_KEY`)
| API | 상태 |
|-----|------|
| 정책브리핑_보도자료(MCST_PRESS) | ✅ 정상 |
| 정책브리핑_정책뉴스 / 종합뉴스 | ✅ 정상 |
| 보조금24 | ⚠️ 점검 중 (포털 응답 지연) |
| 뉴스포토 / 통계 | ⚠️ 점검 중 (빈 데이터 반환) |

### 온통청년(Youth Center) API
- 500건 선수집 후 클라이언트 사이드 필터링 적용 ✅
- `lclsfNm` 필드 우선 활용 (카테고리 정합성) ✅
- `mngtMvmtNm` 으로 실제 운영기관명 표시 ✅

---

## 📋 데이터 모델 (핵심)

```typescript
// Article
{
  id, title, category, prefix,
  category_list: { category, prefix }[],  // 다중 카테고리 (JSONB)
  author, date,          // date는 발행일 — 수정 금지
  views, status,         // 'published' | 'draft'
  summary, content,      // content는 Quill HTML
  hashtags, thumbnail,
  link_button_text, link_url,
  created_at, updated_at
}
```

---

## 🛡️ 안전 작업 프로세스

작업 요청을 받으면 다음 순서를 반드시 따른다:

```
1. 관련 파일 전수 읽기
2. 영향 범위 분석 → 보고
3. 작업 계획 공유 → 승인 대기 (복잡한 경우)
4. 최소 범위 수정
5. 변경 내용 요약 보고
6. git push → Vercel 배포 확인 요청
7. 이 파일(CLAUDE.md) 업데이트
```

---

## 🔄 롤백 포인트

| 날짜 | 커밋 | 상태 |
|------|------|------|
| 2026-04-10 | `main/ecd8cee` | ✅ 안정 (청년정책 API 정상화 완료, 최후 확인 지점) |
| 2026-04-17 | `main/e213421` | ✅ 현재 (MCST 3일 윈도우, MOGEF 기업키 복구) |

---

## 🚀 고도화 마스터 플랜 (2026-04-20 확정)

### 서비스 컨셉
> **"내 지역 복지를 공부하고, 인증받고, 공유한다"**
> 단순 정보 나열이 아닌 학습 → 인증 → 바이럴 순환 구조

### 전체 유저 플로우
```
검색 유입 ("관악구 청년 복지")
  → pSEO 지역 허브 페이지 (/서울/관악구)
      ├── 마감 임박 D-day      ← YOUTH_LIST zipCd 필터
      ├── 새로 시작된 정책     ← YOUTH_LIST 시작일 기준
      ├── 관련 정책 뉴스       ← THE복지 기사 + MCST_NEWS
      └── 복지 퀴즈 CTA
            → 상황 입력 (지역/나이/가구/소득)
            → 정책별 퀴즈 (1정책 = 2문제, DB 수동 제작)
            → 인증서 발급 "연간 최대 OOO만원"
            → ViralShareCard 공유 → 바이럴 신규 유입
```

### 재방문 루프
- 퀴즈 미완료 → 내일 나머지 풀러 재방문 (🔴 높음)
- 새 정책 퀴즈 추가 → 재방문 (🔴 높음)
- 인증서 공유 후 친구 결과 궁금 → 재방문 (🟡 보통)
- 상황 변화(이직/이사/결혼) → 재진단 (🟡 보통)

### pSEO 대상 지역 (총 30개)
- 서울 25개 구 전체
- 경기 5개 시: 수원, 성남, 고양, 용인, 부천

### 기존 재활용 파일
- `src/lib/pseo-matrix.ts` — 지역 avgRent 데이터 (50개 → 30개 조정 예정)
- `src/components/welfare/YouthRentCalculator.tsx` — 수령액 계산 로직
- `src/components/welfare/ViralShareCard.tsx` — 공유 카드 (연결 미완료)
- `src/app/api/public-data/route.ts` — YOUTH_LIST zipCd 파라미터 구현됨

---

## 📌 미결 작업 (Next Tasks)

### 🔴 Phase 1 — 복지 퀴즈 + 인증서 (킬러 콘텐츠 우선)
> **다음 대화에서 바로 시작할 작업 — Phase 1부터 진행**

| 순서 | 작업 | 상태 |
|------|------|------|
| 1-1 | Supabase `welfare_quizzes` 테이블 스키마 설계 및 생성 | ✅ 완료 |
| 1-2 | Supabase `quiz_sessions` 테이블 (진행 상태 저장) | ✅ 완료 |
| 1-3 | 퀴즈 문제 초기 데이터 입력 (정책 15개 × 2문제 = 30문제) | ✅ 완료 |
| 1-4 | 상황 입력 UI (지역/나이/가구/소득 선택) | ✅ 완료 |
| 1-5 | 퀴즈 플로우 UI (`/welfare-quiz` 페이지) | ✅ 완료 |
| 1-6 | 인증서 + ViralShareCard 연결 및 공유 기능 완성 | ✅ 완료 |

### 🟡 Phase 2 — pSEO 지역 허브 페이지 (30개)

| 순서 | 작업 | 상태 |
|------|------|------|
| 2-1 | `/서울/[구]` 라우트 생성 (App Router) | ⬜ 미착수 |
| 2-2 | D-day 섹션 (YOUTH_LIST zipCd 연동) | ⬜ 미착수 |
| 2-3 | 새로 시작된 정책 섹션 | ⬜ 미착수 |
| 2-4 | 관련 뉴스 섹션 (THE복지 기사 + MCST) | ⬜ 미착수 |
| 2-5 | 퀴즈 CTA 섹션 연결 | ⬜ 미착수 |
| 2-6 | ISR 설정 (revalidate: 86400, Supabase 무료플랜 대응) | ⬜ 미착수 |

### 🟢 Phase 3 — 검증 및 확장

| 순서 | 작업 | 상태 |
|------|------|------|
| 3-1 | 서울 5개 구 먼저 오픈 (관악/강남/마포/송파/노원) | ⬜ 미착수 |
| 3-2 | GA4 퀴즈 완료율 / 공유율 측정 | ⬜ 미착수 |
| 3-3 | 검증 후 나머지 25개 지역 확장 | ⬜ 미착수 |

### 기존 미결 (하위 우선순위)
| 우선순위 | 작업 | 상태 |
|---------|------|------|
| 🟡 MED | 관리자 에디터 글머리(List Style) 8종 안정화 | 미결 |
| 🟢 LOW | 보조금24 / 뉴스포토 API 정상화 | 포털 응답 대기 중 |

---

## 📅 최근 작업 내역

| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-04-20 | Phase 1-6 완료: Certificate.tsx + /api/welfare-quiz/session (Supabase 세션 저장, 공유) | ✅ |
| 2026-04-20 | Phase 1-5 완료: 퀴즈 플로우 UI (QuizFlow + QuizResult + WelfareQuizFlow 통합) | ✅ |
| 2026-04-20 | Phase 1-4 완료: 상황 입력 UI (SituationInput.tsx + /welfare-quiz 라우트) | ✅ |
| 2026-04-20 | Phase 1 DB 완료: welfare_quizzes + quiz_sessions 생성, 30문제 입력 | ✅ |
| 2026-04-20 | 고도화 마스터 플랜 확정 (퀴즈+인증서+pSEO 3단계) | ✅ |
| 2026-04-20 | Claude Code 환경 세팅 완료 (CLAUDE.md, skills 16개) | ✅ |
| 2026-04-17 | MCST(3일 윈도우) 및 MOGEF(기업키) API 연결 복구 | ✅ |
| 2026-04-16 | 관리자 에디터 정렬/컬러 도구 삭제 오류 복구 | ✅ |
| 2026-04-10 | THE복지 킬러콘텐츠 통합 전략 PRD 작성 | ✅ |
| 2026-04-10 | 청년정책 API 필터링 및 운영기관 매핑 정상화 | ✅ |
| 2026-04-09 | GA4/GTM 최적화, 작성자 이메일 노출 | ✅ |
| 2026-04-08 | 기사 상세 조회수 제거, 다중 카테고리 구현 | ✅ |
| 2026-04-07 | 관리자 메뉴 관리 고도화, 기사 검색 고도화 | ✅ |
| 2026-04-06 | 이미지 트래픽 최적화, 정책 페이지 복구, SEO | ✅ |
| 2026-03-16 | 대용량 base64 이미지 병목 해결, WebP 자동화 | ✅ |

---

*최종 업데이트: 2026-04-20*
