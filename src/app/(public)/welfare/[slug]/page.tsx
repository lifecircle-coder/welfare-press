// src/app/(public)/welfare/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { generatePSeoSlugs, parsePSeoSlug, formatAmount, WELFARE_POLICIES } from '@/lib/welfare-data';

// 클라이언트 컴포넌트인 계산기는 dynamic import (Window API 의존성 때문)
const YouthRentCalculator = dynamic(
  () => import('@/components/welfare/YouthRentCalculator'),
  { ssr: false, loading: () => <div className="h-[500px] bg-gray-50 animate-pulse rounded-3xl" /> }
);

// ISR: 1일 주기로 재검증
export const revalidate = 86400;

// 빌드 시 60개 페이지(20지역 * 3정책) 정적 생성
export async function generateStaticParams() {
  return generatePSeoSlugs().map(({ slug }) => ({ slug }));
}

// SEO 동적 메타데이터 생성
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { region, policy } = parsePSeoSlug(params.slug);
  if (!region || !policy) return { title: '복지 정보 | THE복지' };

  const title = `${region.name} ${policy.policyName} 신청 자격 및 지원금액 (${formatAmount(policy.maxAmount)}) | THE복지`;
  const description = `${region.name} 거주자를 위한 ${policy.policyName} 안내 가이드. 최대 ${formatAmount(policy.maxAmount)} 지원 혜택, 신청 조건, 필요 서류를 한눈에 확인하고 계산기로 수혜 여부를 즉시 판독하세요.`;

  return {
    title,
    description,
    alternates: { canonical: `/welfare/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `https://thebok.co.kr/welfare/${params.slug}`,
      siteName: 'THE복지',
      locale: 'ko_KR',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default function WelfarePSeoPage({ params }: { params: { slug: string } }) {
  const { region, policy } = parsePSeoSlug(params.slug);

  if (!region || !policy) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-xl text-gray-400">정보가 존재하지 않거나 준비 중입니다.</h1>
        <Link href="/welfare" className="text-blue-600 underline mt-4 inline-block">전체 목록으로 이동</Link>
      </div>
    );
  }

  // 구글 리치 결과를 위한 JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: `${region.name} ${policy.policyName}`,
    description: policy.description,
    provider: { '@type': 'GovernmentOrganization', name: '대한민국 정부' },
    areaServed: { '@type': 'City', name: region.name },
    url: `https://thebok.co.kr/welfare/${params.slug}`,
  };

  return (
    <div className="bg-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* 브레드크럼 */}
        <nav className="flex gap-2 text-xs text-gray-400 mb-8 overflow-hidden whitespace-nowrap">
          <Link href="/">홈</Link> <span>›</span> 
          <Link href="/welfare">복지 정보</Link> <span>›</span> 
          <span className="text-blue-600 font-bold">{region.name} {policy.policyName}</span>
        </nav>

        {/* 상단 섹션 */}
        <header className="mb-12">
          <div className="flex gap-2 mb-4">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase">{policy.category}</span>
            <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase">PROMOTION</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-4">
            {region.name} {policy.policyName}: <br/>
            최대 {formatAmount(policy.maxAmount)} 혜택 총정리
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            {region.name} 거주 청년들이 놓치기 쉬운 {policy.policyName}의 상세 조건과 신청 방법을 정리해 드립니다.
          </p>
        </header>

        {/* 핵심 요약 보드 */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
            <p className="text-xs text-blue-500 font-black mb-1">최대 지원</p>
            <p className="text-2xl font-black text-blue-700">{formatAmount(policy.maxAmount)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl">
            <p className="text-xs text-gray-400 font-black mb-1">지원 대상</p>
            <p className="text-lg font-black text-gray-800">{policy.targetAge}</p>
          </div>
        </div>

        {/* 본문 콘텐츠 */}
        <article className="prose prose-blue max-w-none mb-12">
          <h2 className="text-2xl font-black text-gray-900 mb-4">상세 설명</h2>
          <p className="text-gray-700 leading-8 mb-8">{policy.description}</p>
          
          <h2 className="text-2xl font-black text-gray-900 mb-4">지원 자격</h2>
          <ul className="list-none p-0 space-y-3">
            {policy.eligibility.map((e, i) => (
              <li key={i} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-medium text-gray-800">
                <span className="text-blue-600 text-lg">●</span> {e}
              </li>
            ))}
          </ul>
        </article>

        {/* 인라인 계산기 (사용자 참여 유도) */}
        <section className="mb-16">
          <div className="bg-gray-900 text-white p-6 rounded-[32px] mb-8 relative z-20 text-center">
            <h2 className="text-xl font-black mb-1">나는 얼마나 받을 수 있을까?</h2>
            <p className="text-gray-400 text-xs">30초 만에 내 자격을 판독하고 혜택을 확인하세요</p>
          </div>
          <YouthRentCalculator regionName={region.name} />
        </section>

        {/* 필요 서류 */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6">필요 서류</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {policy.documentRequired.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-gray-600">
                <span className="text-xl">📁</span> {doc}
              </div>
            ))}
          </div>
        </section>

        {/* 하단 여백 확보 */}
        <div className="mb-16"></div>

        {/* 기타 정책 링크 (내부 링크 빌딩) */}
        <footer className="mt-20 pt-10 border-t border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-6">{region.name}의 다른 복지 정책</h3>
          <div className="grid gap-4">
            {WELFARE_POLICIES.filter(p => p.slug !== policy.slug).map(sub => (
              <Link
                key={sub.slug}
                href={`/welfare/${region.code}-${sub.slug}`}
                className="flex items-center justify-between p-6 bg-gray-50 hover:bg-white border border-transparent hover:border-blue-200 rounded-3xl transition-all group"
              >
                <div>
                  <p className="text-sm font-black text-gray-900 mb-1 group-hover:text-blue-600">{sub.policyName}</p>
                  <p className="text-xs text-gray-400">최대 {formatAmount(sub.maxAmount)} 지원</p>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">➡️</span>
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
