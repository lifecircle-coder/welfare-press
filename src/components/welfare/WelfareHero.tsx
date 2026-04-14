// src/components/welfare/WelfareHero.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WelfareHeroProps {
  regionName: string;
  policyName: string;
  maxAmount: string;
}

export default function WelfareHero({ regionName, policyName, maxAmount }: WelfareHeroProps) {
  return (
    <div className="mb-10 text-center md:text-left">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase mb-8"
      >
        <Sparkles className="w-3 h-3" /> Hyper-Local Verified
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8"
      >
        <span className="text-blue-500">{regionName}</span> 거주 청년<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          월세 <span className="text-white underline decoration-blue-600 underline-offset-8">{maxAmount}</span> 확정
        </span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl font-medium mx-auto md:mx-0"
      >
        지금 {regionName}에서 신청 가능한 {policyName} 혜택을 전문가 그룹이 완벽하게 분석했습니다. 1분 자격 판독기로 내 혜택을 확인하세요.
      </motion.p>
    </div>
  );
}
