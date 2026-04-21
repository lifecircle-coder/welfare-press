import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { REGIONS, formatWon } from '@/lib/pseo-matrix';
import DistrictPolicyHub from '@/components/welfare/DistrictPolicyHub';
import LocalLiveFeed from '@/components/welfare/LocalLiveFeed';
import LocalWelfareGuide from '@/components/welfare/LocalWelfareGuide';

export const revalidate = 86400;

const SEOUL_REGIONS = REGIONS.filter(r => r.city === '서울');

export async function generateStaticParams() {
  return SEOUL_REGIONS.map(r => ({ gu: r.code }));
}

export async function generateMetadata(
  { params }: { params: { gu: string } }
): Promise<Metadata> {
  const region = SEOUL_REGIONS.find(r => r.code === params.gu);
  if (!region) return {};
  return {
    title: `서울 ${region.name} 복지 혜택 총정리 | THE복지`,
    description: `서울 ${region.name} 청년·신혼부부를 위한 복지 정책, 청년월세 지원, 마감 임박 정책을 한눈에 확인하세요. 평균 월세 ${formatWon(region.avgRent)}.`,
    openGraph: {
      title: `서울 ${region.name} 복지 혜택 — 지금 신청 가능한 정책`,
      description: `서울 ${region.name} 평균 월세 ${formatWon(region.avgRent)}. 놓치면 손해인 복지 정책을 지금 확인하세요.`,
    },
    alternates: {
      canonical: `/서울/${params.gu}`,
    },
  };
}

export default function SeoulDistrictPage({ params }: { params: { gu: string } }) {
  const region = SEOUL_REGIONS.find(r => r.code === params.gu);
  if (!region) notFound();

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">
            서울 · {region.name} 복지 허브
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
            {region.name} 복지 혜택<br />
            <span className="text-blue-600">지금 신청 가능한 정책</span>
          </h1>
          <p className="text-slate-500 font-medium text-base leading-relaxed max-w-xl mx-auto">
            서울 {region.name} 평균 월세{' '}
            <strong className="text-slate-800">{formatWon(region.avgRent)}</strong>.
            청년 월세 지원부터 신혼부부 정책까지, 놓치면 손해인 혜택을 한눈에 확인하세요.
          </p>
        </div>

        {/* D-day + 새로 시작된 정책 */}
        <DistrictPolicyHub regionName={region.name} />

        {/* 관련 뉴스 */}
        <LocalLiveFeed regionName={region.name} />

        {/* 퀴즈 CTA */}
        <div className="my-20 bg-blue-600 rounded-[2.5rem] p-10 md:p-14 text-center text-white">
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-blue-200">
            THE복지 × 복지 퀴즈
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
            {region.name} 내 혜택,<br />퀴즈로 3분 만에 확인하세요
          </h2>
          <p className="text-blue-100 font-medium mb-8 leading-relaxed text-sm">
            연간 최대 수백만 원의 혜택을 놓치지 마세요.<br />
            퀴즈를 완료하면 인증서도 발급됩니다.
          </p>
          <Link
            href="/welfare-quiz"
            className="inline-block bg-white text-blue-600 font-black px-10 py-4 rounded-2xl text-base hover:shadow-xl hover:scale-105 transition-all"
          >
            무료로 시작하기 →
          </Link>
        </div>

        {/* 관할 부서 안내 */}
        <LocalWelfareGuide
          regionName={region.name}
          phoneNumber={region.phone}
          cityName={region.city}
        />
      </div>
    </main>
  );
}
