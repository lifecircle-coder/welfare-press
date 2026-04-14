// src/app/(public)/welfare/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { generatePSeoSlugs, parsePSeoSlug, formatAmount } from '@/lib/welfare-data';
import { ChevronRight, Home, Info, ShieldCheck, MapPin, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import WelfareHero from '@/components/welfare/WelfareHero';

// 클라이언트 컴포넌트들 (성능 및 Window API 의존성 위해 dynamic import)
const WelfareDiagnoser = dynamic(() => import('@/components/welfare/WelfareDiagnoser'), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-gray-50 animate-pulse rounded-[2.5rem] border border-gray-100" />
});

const LocalLiveFeed = dynamic(() => import('@/components/welfare/LocalLiveFeed'), {
    ssr: false
});

const LocalWelfareGuide = dynamic(() => import('@/components/welfare/LocalWelfareGuide'), {
    ssr: false
});

const DistrictBenefitSuggestor = dynamic(() => import('@/components/welfare/DistrictBenefitSuggestor'), {
    ssr: false
});

// ISR: 1시간(3600초) 주기로 재검증
export const revalidate = 3600;

export async function generateStaticParams() {
    return generatePSeoSlugs().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { region, policy } = parsePSeoSlug(params.slug);
    if (!region || !policy) return { title: '복지 정보 | THE복지' };

    const title = `${region.name} 청년월세지원 신청자격·방법 (최대 ${formatAmount(policy.maxAmount)}) | THE복지`;
    const description = `${region.name} 청년 주목! 월세 부담을 덜어주는 '청년월세지원' 완벽 가이드. ${region.name} 담당 부서 연락처(${region.phone}) 및 실시간 자격 판독기를 확인하세요.`;

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
        keywords: [region.name, '청년월세지원', ...region.tailKeywords],
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
        provider: { 
            '@type': 'GovernmentOrganization', 
            name: `${region.name}청`,
            address: { '@type': 'PostalAddress', addressLocality: region.city, addressRegion: region.name }
        },
        servicePhone: region.phone,
        areaServed: { '@type': 'AdministrativeArea', name: region.name },
        url: `https://thebok.co.kr/welfare/${params.slug}`,
    };

    return (
        <main className="bg-white min-h-screen pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* 1. Traffic Stage: Hero Section - Premium Branding */}
            <div className="relative overflow-hidden bg-slate-950 pt-16 pb-24 md:pt-24 md:pb-32">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
                    <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-indigo-600 rounded-full blur-[150px]" />
                </div>

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <nav className="flex items-center gap-2 text-xs font-bold text-blue-400/80 mb-10 overflow-hidden whitespace-nowrap">
                        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><Home className="w-3 h-3" /> 홈</Link>
                        <ChevronRight className="w-3 h-3 text-slate-800" />
                        <Link href="/welfare" className="hover:text-white transition-colors">복합혜택</Link>
                        <ChevronRight className="w-3 h-3 text-slate-800" />
                        <span className="text-slate-500">{region.name} 전용</span>
                    </nav>

                    <WelfareHero 
                      regionName={region.name} 
                      policyName={policy.policyName} 
                      maxAmount={formatAmount(policy.maxAmount)} 
                    />

                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {region.tailKeywords.map((kw, i) => (
                            <span key={i} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/50 text-xs font-black rounded-2xl">
                                #{kw.replace(/\s/g, '')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-20">
                {/* 2. Engagement Stage: Interactive Diagnoser */}
                <WelfareDiagnoser regionName={region.name} policy={policy} />

                {/* Local Guide Section: Contact & Expert Tips */}
                <LocalWelfareGuide 
                  regionName={region.name} 
                  phoneNumber={region.phone} 
                  cityName={region.city}
                />

                {/* Policy Detail Section */}
                <div className="mt-24 space-y-20">
                    <section className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Info className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">정책 핵심 가이드</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Essential Policy Brief</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <p className="text-base text-slate-600 leading-relaxed font-medium">
                                    {policy.description}
                                </p>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="flex items-center gap-2 font-black text-slate-900 mb-4 text-sm">
                                        <Building2 className="w-4 h-4 text-blue-600" /> 운영 기관 및 기간
                                    </h4>
                                    <ul className="space-y-2 text-xs font-bold text-slate-500">
                                        <li className="flex justify-between"><span>주관 부처</span> <span className="text-slate-900">국토교통부</span></li>
                                        <li className="flex justify-between"><span>지역 담당</span> <span className="text-slate-900">{region.name} {region.city}청</span></li>
                                        <li className="flex justify-between"><span>신청 기한</span> <span className="text-blue-600">{policy.deadline}</span></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 수혜 자격 체크리스트
                                </h4>
                                <ul className="space-y-4">
                                    {policy.eligibility.map((e, i) => (
                                        <li key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm font-bold text-slate-600">
                                            <span className="text-blue-500">0{i+1}</span> {e}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Preparation Section */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-slate-900 mb-4">준비 서류 완벽 체크</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Required Documentation</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {policy.documentRequired.map((doc, i) => (
                                <div key={i} className="flex flex-col gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl hover:shadow-blue-500/5 transition-all text-center group">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:scale-110 transition-all mx-auto">📁</div>
                                    <span className="text-xs font-black text-slate-700 leading-tight">{doc}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* 3. Viral Stage: Multi-District Suggestions */}
                <DistrictBenefitSuggestor 
                  zipCd={region.zipCd} 
                  regionName={region.name} 
                  excludePolicyName={policy.policyName}
                />

                {/* 4. Repeat/Traffic Stage: Local News Feed */}
                <div className="mt-32 pt-32 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">{region.name} 실시간 소식</h3>
                            <p className="text-slate-500 font-bold">우리 동네의 최신 복지 및 정책 뉴스를 전해드립니다.</p>
                        </div>
                        <Link href="/welfare" className="text-sm font-black text-blue-600 border-b-2 border-blue-600 pb-1">
                            전체 소식 더보기
                        </Link>
                    </div>
                    <LocalLiveFeed regionName={region.name} />
                </div>

                {/* Final CTA / Social Proof */}
                <section className="mt-20 p-10 md:p-16 bg-gradient-to-br from-slate-900 to-black rounded-[3rem] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-6">
                            이미 <span className="text-blue-500">{region.name}</span> 수많은 청년들이<br />혜택을 받기 시작했습니다
                        </h3>
                        <p className="text-slate-400 text-sm font-medium mb-10 max-w-lg mx-auto leading-relaxed">
                            {policy.policyName}의 예산은 한정되어 있습니다. 자격이 확인되었다면 더 이상 미루지 말고 지금 바로 공식 창구에서 신청을 완료하세요.
                        </p>
                        <a 
                          href={policy.applicationUrl} 
                          target="_blank"
                          className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl"
                        >
                            공식 신청 사이트 이동 <ChevronRight className="w-5 h-5" />
                        </a>
                    </div>
                </section>
            </div>
        </main>
    );
}
