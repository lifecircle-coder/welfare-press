# THE복지 (thebok.co.kr) — Claude 작업 가이드

## 🚨 절대 준수 규칙

0. **토큰 효율 최우선** — 토큰 소모를 최소화하면서 결과물 퀄리티는 최고로 만든다. 불필요한 파일 탐색·중복 읽기·장황한 설명을 금지한다. 핵심만 파악하고 바로 실행한다.
1. **요청한 것만 수정** — 지시한 파일·기능 외 절대 건드리지 않는다.
2. **기존 기능 보호** — 수정 전 영향 범위 분석 필수.
3. **필요한 파일만 읽기** — 추측으로 코드 작성 금지. 단, 전수조사는 하지 않는다.
4. **한 번에 완료** — 반복 오류 최소화.
5. **실서버 기준** — GitHub push → Vercel 자동 배포 → `thebok.co.kr` 확인 후 완료.
6. **작업 완료 시 이 파일 업데이트** — 작업 내역, 롤백 포인트 기록.
7. **직접 요청** — GitHub 인증, Supabase SQL 실행 등은 사용자에게 직접 요청.

---

## ⚙️ 작업 워크플로우

```
[요청] → [Plan 보고] → [승인] → [실행] → [결과 보고] → [CLAUDE.md 업데이트]
```

| 난이도 | 해당 작업 | 접근법 |
|--------|----------|--------|
| 🔴 고난도 | 아키텍처 변경, DB 스키마, 신규 기능 설계 | Plan Mode → 승인 후 실행 |
| 🟡 중난도 | 컴포넌트 수정, API 연동 | 영향 범위 보고 → 승인 후 실행 |
| 🟢 단순 | 텍스트·CSS 미세 수정 | 바로 실행 |

**승인 없이 절대 진행 금지**: DB 스키마 변경, 구조 리팩토링, 환경변수 변경, 신규 라이브러리 설치

**MCP 활용**:
- Next.js / Supabase 문법 확인 → Context7 MCP
- DB 조회 / SQL 실행 → Supabase MCP
- 복잡한 단계 분석 → Sequential Thinking MCP

---

## 🏗️ 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | THE복지 |
| 도메인 | https://thebok.co.kr |
| 로컬 실행 | `npm run dev` → http://localhost:3000 |
| 배포 | Vercel (GitHub main push → 자동 배포) |

**기술 스택**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth), Vercel

---

## 🔐 핵심 아키텍처 규칙

### Supabase 클라이언트 분리 (절대 혼용 금지)
- `supabase` — 퍼블릭(홈페이지) 전용
- `adminSupabase` — 관리자 전용 (RLS 우회, persistSession: false)
- `VisitorTracker.tsx` — `/admin` 경로 진입 시 즉시 중단

### 발행일(date) 보호
- `date` 필드는 기사 최초 발행 시점 고유값 — 수정 시 절대 변경 금지
- 관리자 UI에서 `readOnly` 유지

### 이미지 처리
- 에디터 이미지 → Canvas 1200px 리사이징 → WebP → Supabase Storage → URL 교체
- Base64 이미지 DB 직접 저장 금지 (Vercel 4.5MB 제한)
- `SafeImage.tsx` — Supabase Image Transformation API 연동

### UI 표준
- 최대 가로폭: 1280px / 반응형: 1280px 미만 Fluid
- 날짜: `toLocaleString('ko-KR')`

---

## 📋 데이터 모델

```typescript
// Article
{ id, title, category, prefix,
  category_list: { category, prefix }[],  // 다중 카테고리 (JSONB)
  author, date,        // date는 발행일 — 수정 금지
  views, status,       // 'published' | 'draft'
  summary, content,    // content는 Quill HTML
  hashtags, thumbnail,
  link_button_text, link_url,
  created_at, updated_at }
```

---

## 🔄 롤백 포인트

| 날짜 | 커밋 | 상태 |
|------|------|------|
| 2026-04-10 | `main/ecd8cee` | ✅ 안정 |
| 2026-04-17 | `main/e213421` | ✅ 안정 |
| 2026-04-20 | Phase 1 완료 시점 | ✅ 안정 |
| 2026-04-21 | Phase 2-1 완료 시점 | ✅ 안정 |
| 2026-04-21 | Phase 3-3 완료 시점 (`3b3cd90`) | ✅ 안정 |
| 2026-04-21 | Phase 3-2 완료 시점 (`f0a80c0`) | ✅ 현재 |

---

## 📌 미결 작업

### 🟡 Phase 2 — pSEO 지역 허브 페이지 (30개)

| 순서 | 작업 | 상태 |
|------|------|------|
| 2-1 | `/서울/[구]` 라우트 생성 | ✅ |
| 2-2 | D-day 섹션 (YOUTH_LIST zipCd 연동) | ✅ |
| 2-3 | 새로 시작된 정책 섹션 | ✅ |
| 2-4 | 관련 뉴스 섹션 (THE복지 + MCST) | ✅ |
| 2-5 | 퀴즈 CTA 섹션 연결 | ✅ |
| 2-6 | ISR 설정 (revalidate: 86400) | ✅ |

### 🟢 Phase 3 — 검증 및 확장

| 순서 | 작업 | 상태 |
|------|------|------|
| 3-1 | 서울 5개 구 먼저 오픈 (관악/강남/마포/송파/노원) | ✅ |
| 3-2 | GA4 퀴즈 완료율 / 공유율 측정 | ✅ |
| 3-3 | 서울 나머지 20개 구 확장 (전체 25개 구 오픈) | ✅ |

### 기타 미결

| 우선순위 | 작업 | 상태 |
|---------|------|------|
| 🟡 MED | 관리자 에디터 글머리(List Style) 8종 안정화 | 미결 |
| 🟢 LOW | 보조금24 / 뉴스포토 API 정상화 | 포털 응답 대기 중 |

---

## 📅 최근 작업 내역

| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-04-24 | 관리자 기사 작성 프롬프트 고도화 및 출력 형식 규격화 (변 기자 페르소나 적용) | ✅ |
| 2026-04-21 | Phase 3-2: GA4 퀴즈 이벤트 5종 추가 (quiz_start/complete/certificate_view/share/copy_link) | ✅ |

---

*최종 업데이트: 2026-04-24 (관리자 프롬프트 고도화 완료)*
