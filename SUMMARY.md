# 프로젝트 인수인계 요약: 복지프레스 관리자 안정화

## 1. 현재 시스템 상태 (2026-04-17 기준)

### ✅ 핵심 기능 상태
- **기술 스택**: Next.js 14.x (App Router), Supabase (Auth/Storage/DB), Tailwind CSS.
- **관리자 에디터**: 모든 오류(인증, 이미지 업로드, 본문 노출)가 해결된 안정 상태입니다.
- **인증 분리**: 관리자(`sb-admin-auth`)와 사용자(`sb-public-auth`) 세션이 완벽히 분리되어 있습니다.
- **이미지 업로드**: `adminSupabase` 전용 클라이언트를 사용하며, WebP 최적화 후 `partnership_files` 버킷에 저장됩니다.
- **참조 안전성**: 에디터 내 비동기 작업 시 `(this as any).quill`을 사용하여 `null` 참조 오류를 원천 차단했습니다.

### 🛠️ 주요 파일
- `src/lib/supabaseClient.ts`: 분리된 클라이언트 설정.
- `src/lib/services.ts`: 추적 로그가 포함된 기사 및 업로드 서비스.
- `src/components/admin/ClientQuillEditor.tsx`: 안정화된 최신 에디터.

---

## 2. 기술적 제약 및 주의사항

> [!IMPORTANT]
> **관리자 작업 시**: 반드시 `adminSupabase`를 사용하십시오. 일반 `supabase` 클라이언트는 권한 문제로 `403` 오류를 발생시킵니다.

> [!CAUTION]
> **에디터 수정 시**: 비동기 콜백(`async/await`) 내에서는 `quillRef.current`가 `null`이 될 수 있으므로, 반드시 `(this as any).quill`을 통해 내부 인스턴스를 직접 호출해야 합니다.

