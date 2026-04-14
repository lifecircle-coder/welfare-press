// src/app/(public)/welfare/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { WELFARE_POLICIES, TARGET_REGIONS, formatAmount } from '@/lib/welfare-data';
import { MapPin, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: '청년 복지 정책 지역별 맞춤 가이드 | THE복지',
  description: '내일저축계좌, 청년 월세 지원, 근로장려금 등 대한민국 핵심 복지 정보를 지역별로 맞춤 제공합니다. 나에게 딱 맞는 혜택을 1분 만에 찾으세요.',
  robots: { index: true, follow: true },
};

export default function WelfareIndexPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-30">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion_div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-black tracking-widest uppercase mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" /> 2024-2025 최신 복지 로드맵
          </motion_div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-8">
            복잡한 혜택,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-black">내 지역 맞춤</span>으로 찾기
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            정부와 지자체가 준비한 수천 개의 정책 중 나에게 최적화된 혜택만 골라보세요. 
            현금 지원부터 주거 자금까지, 단 3번의 클릭으로 충분합니다.
          </p>
        </div>
      </section>

      {/* Trust Stats */}
      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { label: '활성 정책수', val: '2,400+', icon: <Zap className="w-5 h-5" /> },
                { label: '누적 방문자', val: '150만명', icon: <Sparkles className="w-5 h-5" /> },
                { label: '데이터 정확도', val: '99.9%', icon: <ShieldCheck className="w-5 h-5" /> },
            ].map((stat, i) => (
                <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900">{stat.val}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        {stat.icon}
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">핵심 킬러 콘텐츠</h2>
                <p className="text-gray-500 mt-2 font-medium">가장 많은 분들이 선택한 TOP 3 복지 정책입니다.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 실시간 업데이트 중
            </div>
        </div>

        {/* 정책 카드 그리드 */}
        <div className="grid gap-12">
          {WELFARE_POLICIES.map((policy, i) => (
            <div key={policy.slug} className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm group-hover:shadow-xl transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">{policy.category}</span>
                      <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">{policy.targetAge}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
                      {policy.policyName}
                    </h3>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium line-clamp-2">
                        {policy.description}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-6 rounded-3xl min-w-[200px] text-right border border-blue-100">
                    <p className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest">MAX SUPPORT</p>
                    <p className="text-3xl font-black text-blue-700">{formatAmount(policy.maxAmount)}</p>
                  </div>
                </div>

                {/* 지역별 빠른 이동 */}
                <div className="pt-8 border-t border-gray-50">
                  <h4 className="text-xs font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                    <MapPin className="w-4 h-4 text-blue-600" /> 맞춤형 지역별 정보 바로가기
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {TARGET_REGIONS.map(region => (
                      <Link
                        key={region.code}
                        href={`/welfare/${region.code}-${policy.slug}`}
                        className="bg-gray-50 hover:bg-white text-gray-500 hover:text-blue-600 border border-transparent hover:border-blue-500 p-4 rounded-2xl text-xs font-black transition-all text-center shadow-sm hover:shadow-blue-100 flex items-center justify-center group/btn"
                      >
                        {region.name} <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-1 group-hover/btn:translate-x-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Framer Motion을 위한 임시 억제 (서버 컴포넌트 환경)
function motion_div({ children, ...props }: any) {
    return <div {...props}>{children}</div>;
}
