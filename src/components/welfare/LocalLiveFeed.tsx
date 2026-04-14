// src/components/welfare/LocalLiveFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Clock, ExternalLink, ChevronRight, Zap } from 'lucide-react';
import { WelfareService } from '@/lib/api/publicData';

export default function LocalLiveFeed({ regionName }: { regionName: string }) {
  const [news, setNews] = useState<WelfareService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        // 실제 운영 시에는 서버 액션을 통해 ISR 캐시된 데이터를 가져오거나 
        // 클라이언트에서 fetch (/api/public-data?type=MCST_PRESS) 할 수 있음.
        // 여기서는 MVP 시연을 위해 클라이언트 사이드 fetch 시뮬레이션
        const res = await fetch(`/api/public-data?type=MCST_PRESS&pageNo=1&numOfRows=5&query=${encodeURIComponent(regionName)}`);
        const data = await res.json();
        setNews(data || []);
      } catch (err) {
        console.error('Failed to fetch local news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [regionName]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto my-12 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-16 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-600" />
            실시간 {regionName} 소식
          </h4>
          <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-tighter">LIVE NEWS & PRESS FEED</p>
        </div>
        <button className="text-gray-400 hover:text-blue-600 font-black text-xs flex items-center gap-1 transition-all">
          전체보기 <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {news.length > 0 ? (
          news.map((item, i) => (
            <motion.a
              key={item.servId}
              href={item.servDtlLink}
              target="_blank"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group bg-white border border-gray-100 p-6 rounded-[1.5rem] hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-red-600" /> LIVE
                    </span>
                    <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase">{item.jurMnofNm}</span>
                </div>
                <h5 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {item.servNm}
                </h5>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.svcfrstRegTs ? `${item.svcfrstRegTs.substring(0,4)}.${item.svcfrstRegTs.substring(4,6)}.${item.svcfrstRegTs.substring(6,8)}` : '오늘'}</span>
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">보도자료</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:block w-px h-10 bg-gray-100" />
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </motion.a>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">최근 등록된 {regionName} 소식이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Trust Quote */}
      <div className="mt-12 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-xs text-blue-800 leading-relaxed font-medium">
            <strong>THE복지 뉴스 허브</strong>는 문화체육관광부 보도자료 및 지역 정책 뉴스를 실시간으로 수집하여 제공합니다. 
            매일 오전 09:00 - 18:00 사이 가장 빠른 소식을 확인하세요.
        </p>
      </div>
    </div>
  );
}
