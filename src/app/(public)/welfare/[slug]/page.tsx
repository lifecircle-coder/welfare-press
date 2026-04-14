// src/app/(public)/welfare/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { generatePSeoSlugs, parsePSeoSlug, formatAmount, WELFARE_POLICIES } from '@/lib/welfare-data';
import { ChevronRight, Home, Info, ShieldCheck, MapPin } from 'lucide-react';

// 클라이언트 컴포넌트들 (성능 및 Window API 의존성 위해 dynamic import)
const WelfareDiagnoser = dynamic(() => import('@/components/welfare/WelfareDiagnoser'), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-gray-50 animate-pulse rounded-[2.5rem] border border-gray-100" />
});

const ViralShareCard = dynamic(() => import('@/components/welfare/ViralShareCard'), {
    ssr: false
});

const LocalLiveFeed = dynamic(() => import('@/components/welfare/LocalLiveFeed'), {
    ssr: false
});

// ISR: 1시간(3600초) 주기로 재검증 (공공데이터 동기화 및 부하 방지 최적점)
export const revalidate = 3600;

export async function generateStaticParams() {
    return generatePSeoSlugs().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { region, policy } = parsePSeoSlug(params.slug);
    if (!region || !policy) return { title: '복지 정보 | THE복지' };

    const title = `${region.name} ${policy.policyName} 신청자격·지원금액·방법 (${formatAmount(policy.maxAmount)}) | THE복지`;
    const description = `${region.name} ${policy.policyName} 완벽 가이드! ${region.tailKeywords.join(', ')}. 최대 ${formatAmount(policy.maxAmount)} 혜택을 놓치지 마세요. 실시간 진단기로 자격 확인이 가능합니다.`;

    return {
        title,
        description,
        alternates: { canonical: `/welfare/${params.slug}` },
        openGraph: {
            title,
            description,
            url: `https://thebok.co.kr/welfare/${params.slug}`,
            images: [`/api/og?title=${encodeURIComponent(region.name + ' ' + policy.policyName)}`],
            siteName: 'THE복지',
            locale: 'ko_KR',
            type: 'article',
        },
        keywords: [region.name, policy.policyName, ...region.tailKeywords],
    };
}

export default function WelfarePSeoPage({ params }: { params: { slug: string } }) {
    const { region, policy } = parsePSeoSlug(params.slug);

    if (!region || !policy) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-gray-900 mb-4">존재하지 않는 복지 정책입니다.</h1>
                    <Link href="/welfare" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">전체 목록보기</Link>
                </div>
            </div>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'GovernmentService',
        name: `${region.name} ${policy.policyName}`,
        description: policy.description,
        provider: { '@type': 'GovernmentOrganization', name: '대한민국 정부' },
        areaServed: { '@type': 'AdministrativeArea', name: region.name },
        url: `https://thebok.co.kr/welfare/${params.slug}`,
    };

    return (
        <main className="bg-white min-h-screen pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* 1. Traffic Stage: Hero Section with Dynamic Content */}
            <div className="relative overflow-hidden bg-slate-900 pt-16 pb-24 md:pt-24 md:pb-32">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <nav className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-8 overflow-hidden whitespace-nowrap">
                        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><Home className="w-3 h-3" /> 홈</Link>
                        <ChevronRight className="w-3 h-3 text-slate-700" />
                        <Link href="/welfare" className="hover:text-white transition-colors">복합혜택</Link>
                        <ChevronRight className="w-3 h-3 text-slate-700" />
                        <span className="text-slate-400">{region.name} {policy.policyName}</span>
                    </nav>

                    <div className="mb-8">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase mb-6">
                            <MapPin className="w-3 h-3" /> {region.name} 특화 정보
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.15] tracking-tighter mb-8">
                            {region.name} {policy.policyName}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                최대 {formatAmount(policy.maxAmount)}
                            </span> 지원금 총정리
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl font-medium">
                            {region.name} 지역 청년들을 위해 설계된 {policy.policyName}의 상세 조건, 신청 방법, 필요 서류를 누락 없이 정리해 드립니다. 
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {region.tailKeywords.map((kw, i) => (
                            <span key={i} className="px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-bold rounded-xl italic">
                                #{kw.replace(/\s/g, '')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
                {/* 2. Retention Stage: AI Diagnoser */}
                <WelfareDiagnoser regionName={region.name} />

                {/* Policy Detail Article */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20">
                    <div className="md:col-span-2 space-y-16">
                        <section>
                            <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                <Info className="w-8 h-8 text-blue-600" /> 정책 가이드
                            </h2>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-lg text-gray-600 leading-8">
                                    {policy.description}
                                </p>
                                <div className="mt-10 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">수혜 필수 요건</h3>
                                    <ul className="space-y-4 p-0 list-none">
                                        {policy.eligibility.map((e, i) => (
                                            <li key={i} className="flex gap-4 items-start text-gray-700 text-sm font-semibold">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 text-[10px]">✔</div>
                                                {e}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 mb-8">준비 서류 (Checklist)</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {policy.documentRequired.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📄</div>
                                        <span className="text-sm font-bold text-gray-600">{doc}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Floating Support */}
                    <div className="space-y-8">
                        <div className="sticky top-24 p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            <h3 className="text-xl font-black mb-4 relative z-10 leading-tight">지금 바로<br />신청 가능합니다</h3>
                            <p className="text-xs text-blue-100 mb-8 font-medium relative z-10 leading-relaxed">
                                {region.name} {policy.policyName}의 예산이 소지금 되기 전에 신청을 서두르세요.
                            </p>
                            <a href={policy.applicationUrl} target="_blank" className="block w-full py-4 bg-white text-blue-600 rounded-xl font-black text-center text-sm shadow-lg hover:scale-[1.02] transition-transform relative z-10">
                                공식 신청 페이지 바로가기
                            </a>
                        </div>
                        
                        <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-tighter">DATA INTEGRITY</span>
                            </div>
                            <h4 className="text-lg font-bold mb-2 tracking-tight">검증된 데이터</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                본 정보는 공공기관 API와 고시문을 대조하여 작성되었습니다. 자격 요건은 거주 지역의 실제 고시 날짜에 따라 다소 차이가 있을 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Viral Stage: Altruistic Sharing */}
                <ViralShareCard 
                    policyName={policy.policyName} 
                    regionName={region.name} 
                    amount={formatAmount(policy.maxAmount)} 
                />

                {/* 4. Repeat Stage: Local Feed */}
                <div className="mt-24 pt-24 border-t border-gray-100">
                    <LocalLiveFeed regionName={region.name} />
                </div>

                {/* Footer Section: Internal Linking */}
                <section className="mt-20">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">
                            {region.name} 거주자를 위한 추천 정책
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {WELFARE_POLICIES.filter(p => p.slug !== policy.slug).map(sub => (
                            <Link
                                key={sub.slug}
                                href={`/welfare/${region.code}-${sub.slug}`}
                                className="group flex items-center justify-between p-8 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-500 rounded-[2rem] transition-all"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{sub.category}</span>
                                    <h4 className="text-xl font-black text-gray-900">{sub.policyName}</h4>
                                    <p className="text-xs text-gray-400 font-bold mt-1">최대 {formatAmount(sub.maxAmount)} 지급</p>
                                </div>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all text-gray-300">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
