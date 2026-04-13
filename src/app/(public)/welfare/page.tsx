// src/app/(public)/welfare/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { WELFARE_POLICIES, TARGET_REGIONS, formatAmount } from '@/lib/welfare-data';

export const metadata: Metadata = {
  title: '청년 복지 정책 지역별 총정리 | THE복지',
  description: '청년 월세 지원, 내일저축계좌, 근로장려금 등 대한민국 핵심 복지 정책을 지역별로 정리했습니다. 나에게 맞는 혜택을 30초 만에 확인하세요.',
  robots: { index: true, follow: true },
};

export default function WelfareIndexPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-5">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <div className="inline-block bg-blue-600 text-white font-black px-4 py-1 rounded-full text-xs mb-4">
            WELFARE HUB
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6">
            모든 복지를 <span className="text-blue-600">내 손안에</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
            국가와 지자체가 제공하는 수천 개의 복지 정책 중, 나에게 딱 맞는 혜택만 골라보세요. 
            현금 지원부터 주거 자금까지 지역별로 즉시 확인 가능합니다.
          </p>
        </header>

        {/* 정책 카드 그리드 */}
        <div className="grid gap-10">
          {WELFARE_POLICIES.map(policy => (
            <div key={policy.slug} className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full">{policy.category}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{policy.targetAge}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                    {policy.policyName}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-widest">MAX BENEFIT</p>
                  <p className="text-3xl md:text-4xl font-black text-blue-600">{formatAmount(policy.maxAmount)}</p>
                </div>
              </div>

              <p className="text-gray-500 leading-relaxed mb-8 font-medium">
                {policy.description}
              </p>

              {/* 지역별 빠른 이동 (pSEO 입구) */}
              <div className="bg-gray-50 rounded-3xl p-6">
                <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                  📍 우리 지역 혜택 확인하기
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TARGET_REGIONS.map(region => (
                    <Link
                      key={region.code}
                      href={`/welfare/${region.code}-${policy.slug}`}
                      className="bg-white hover:bg-blue-600 text-gray-600 hover:text-white border border-gray-200 hover:border-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {region.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
