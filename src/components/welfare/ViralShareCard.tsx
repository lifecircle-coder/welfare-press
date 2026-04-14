// src/components/welfare/ViralShareCard.tsx
'use client';

import { motion } from 'framer-motion';
import { Send, Share2, Copy, Gift, MessageSquare, Heart } from 'lucide-react';

export default function ViralShareCard({ policyName, regionName, amount }: { policyName: string, regionName: string, amount: string }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('링크가 복사되었습니다! 지인에게 혜택을 선물하세요. 🎁');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `[THE복지] ${regionName} 지인을 위한 혜택 선물`,
        text: `${regionName}에 사는 지인이 있다면 이 소식을 꼭 전해주세요! ${policyName}으로 최대 ${amount} 혜택을 받을 수 있습니다.`,
        url: shareUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative group mt-8"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row">
            {/* Left Decor */}
            <div className="w-full md:w-2/5 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex flex-col items-center justify-center text-white text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/30 shadow-inner"
              >
                <Gift className="w-12 h-12 text-white" />
              </motion.div>
              <h4 className="text-xl font-black leading-tight">지인에게<br />혜택을 선물하세요</h4>
              <p className="text-indigo-100 text-[10px] mt-4 font-bold opacity-80 uppercase tracking-widest leading-relaxed">ALTRUISTIC SHARING<br />CAMPAIGN</p>
            </div>

            {/* Right Content */}
            <div className="w-full md:w-3/5 p-8 flex flex-col justify-center">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="text-xs font-black text-pink-500 uppercase tracking-tighter">나만 알기 아까운 정보</span>
                </div>
                <h5 className="text-xl font-bold text-gray-900 leading-snug">
                  "<span className="text-indigo-600">{regionName}</span>에 사는<br />친구가 생각나나요?"
                </h5>
                <p className="text-sm text-gray-500 mt-3 font-medium leading-relaxed">
                  본인이 아니더라도, 주변 친구나 가족이 <strong>최대 {amount}</strong>의 혜택을 놓치고 있을 수 있습니다. 지금 알려주세요!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShare}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-lg shadow-indigo-200"
                >
                  <Share2 className="w-5 h-5" /> 공유하기
                </button>
                <button
                  onClick={handleCopyLink}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all border border-gray-200"
                >
                  <Copy className="w-5 h-5" /> 링크복사
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden`}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">+12k</div>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">현재 1.2만명 이상이 공유했습니다</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
