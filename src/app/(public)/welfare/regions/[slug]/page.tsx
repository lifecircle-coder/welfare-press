import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
    getWelfareRegionBySlug, 
    getPoliciesByRegion, 
    getAllRegionSlugs 
} from '@/lib/welfare-pseo';
import WelfareRegionHero from '@/components/welfare/WelfareRegionHero';

export const revalidate = 3600; // 1시간마다 데이터 갱신 (ISR)
import WelfarePolicyGrid from '@/components/welfare/WelfarePolicyGrid';
import LocalLiveFeed from '@/components/welfare/LocalLiveFeed';
import { Sparkles, MapPin, Zap } from 'lucide-react';
import Link from 'next/link';

interface Props {
    params: { slug: string };
}

export async function generateStaticParams() {
    const slugs = await getAllRegionSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const region = await getWelfareRegionBySlug(params.slug);
    if (!region) return { title: '지역 정보 없음 | THE복지' };

    return {
        title: `${region.name} 청년 복지 정책 및 지원금 완전 가이드 (2025 최신)`,
        description: `${region.name} 거주 청년들을 위한 맞춤형 복지 로드맵. 월세 지원부터 일자리 정책까지, ${region.name}만의 전용 혜택을 확인하세요.`,
        openGraph: {
            title: `${region.name} 청년들을 위한 특별한 혜택 모음`,
            description: `${region.name} 청년이라면 놓쳐선 안 될 2025년 복지 리스트를 지금 확인하세요.`,
        }
    };
}

export default async function WelfareRegionPage({ params }: Props) {
    const region = await getWelfareRegionBySlug(params.slug);
    if (!region) notFound();

    const policies = await getPoliciesByRegion(region.id);

    return (
        <div className="bg-white min-h-screen pb-32">
            {/* Hero Section (Unique per Region) */}
            <WelfareRegionHero region={region} />

            <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">맞춤형 정책 추천</h2>
                                <p className="text-slate-500 mt-2 font-medium">
                                    {region.name} 청년들에게 가장 유리한 정책 {policies.length}개를 선별했습니다.
                                </p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-xs font-black text-slate-400">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 실시간 업데이트
                            </div>
                        </div>

                        {/* Policies List */}
                        <WelfarePolicyGrid policies={policies} />

                        {/* Local News Feed (SEO & Uniqueness) */}
                        <div className="mt-24">
                            <LocalLiveFeed regionName={region.name} />
                        </div>
                    </div>

                    {/* Sidebar Area (Internal Linking for SEO) */}
                    <aside className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-30" />
                                <h4 className="text-xl font-black mb-4 relative z-10">다른 지역은 어떨까요?</h4>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed relative z-10">
                                    거주지를 옮길 계획이신가요? <br />
                                    관심 있는 다른 구의 혜택도 비교해 보세요.
                                </p>
                                <div className="space-y-3 relative z-10">
                                    {['mapo-gu', 'gwanak-gu', 'gangnam-gu'].filter(id => id !== params.slug).map(id => (
                                        <Link 
                                            key={id} 
                                            href={`/welfare/regions/${id}`}
                                            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold"
                                        >
                                            <span className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-blue-400" />
                                                {id.replace('-gu', '구').toUpperCase()}
                                            </span>
                                            <Zap className="w-4 h-4 text-slate-500" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8">
                                <h4 className="text-lg font-black text-blue-900 mb-2">복지 알림 신청</h4>
                                <p className="text-blue-700/70 text-sm mb-6 font-medium">
                                    {region.name}의 새로운 정책이 나오면 <br />
                                    누구보다 빠르게 알려드릴게요.
                                </p>
                                <button className="w-full py-4 bg-white text-blue-600 border border-blue-200 rounded-2xl text-sm font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                    1초 만에 알림받기
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
