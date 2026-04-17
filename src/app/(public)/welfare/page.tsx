// src/app/(public)/welfare/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '복지 정책 정보 안내 | THE복지',
  description: '청년, 어르신, 저소득층을 위한 대한민국 복지 정책 정보를 제공합니다.',
  robots: { index: true, follow: true },
};

export default function WelfareIndexPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 bg-slate-900 overflow-hidden text-center">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-8">
            복지 정책 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-black">정보 라이브러리</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            정부와 지자체가 제공하는 다양한 복지 혜택 정보를 한곳에서 확인하세요. <br />
            더 나은 내일을 위한 소중한 정보를 전달합니다.
          </p>
        </div>
      </section>

      {/* Basic Content Placeholder */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-12 md:p-20">
          <h2 className="text-2xl font-black text-slate-900 mb-4">현재 정보를 준비 중입니다.</h2>
          <p className="text-slate-500 font-medium">
            사용자 여러분께 더 정확하고 유익한 복지 정보를 제공하기 위해 <br />
            콘텐츠를 업데이트하고 있습니다. 잠시만 기다려 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
