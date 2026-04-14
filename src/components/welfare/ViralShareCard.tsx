// src/components/welfare/ViralShareCard.tsx
'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, CheckCircle2, Trophy, Sparkles } from 'lucide-react';

interface ViralShareCardProps {
  regionName: string;
  policyName: string;
  maxAmount: string;
  userName?: string;
}

export default function ViralShareCard({ regionName, policyName, maxAmount, userName = '청년' }: ViralShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[${regionName}] ${policyName} 확인 완료!`,
          text: `축하합니다! ${userName}님은 최대 ${maxAmount} 혜택 대상입니다. 지금 바로 확인해보세요.`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-12 mb-16 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-[2px] rounded-[2.5rem] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-blue-500/20"
      >
        <div ref={cardRef} className="bg-slate-900 rounded-[2.4rem] overflow-hidden p-8 md:p-10">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-blue-400 text-xs font-black tracking-tighter uppercase">Benefit Confirmed</span>
            </div>
            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>

          <div className="mb-10">
            <h3 className="text-white text-3xl md:text-4xl font-black leading-tight mb-4">
              <span className="text-blue-400">{regionName}</span> 가구<br />
              예상 혜택 <span className="underline decoration-purple-500 underline-offset-8">{maxAmount}</span>
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              {policyName} 자격 진단 결과,<br />
              {userName}님은 위 금액의 수혜 대상자로 예상됩니다.
            </p>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-slate-200 text-sm font-bold">자격 판독 점수: 98/100</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-slate-200 text-sm font-bold">지역 특화 가산점 적용됨</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all active:scale-95"
            >
              <Share2 className="w-5 h-5" /> 친구에게 공유하기
            </button>
            <button 
              className="sm:w-16 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black transition-all active:scale-95"
              title="이미지로 저장"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
              Powered by THE복지 Hyper-Local Engine
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
