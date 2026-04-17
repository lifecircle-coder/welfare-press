// src/components/welfare/HierarchicalRegionSelector.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TARGET_REGIONS, WELFARE_POLICIES } from '@/lib/welfare-data';
import { MapPin, ChevronRight, ArrowRight, Building2, Search } from 'lucide-react';

export default function HierarchicalRegionSelector() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  // 지원 정책 (청년월세지원 고정)
  const policy = WELFARE_POLICIES[0];

  // 시/도 목록 추출 (중복 제거)
  const cities = useMemo(() => {
    const citySet = new Set(TARGET_REGIONS.map(r => r.city));
    // 주요 시/도 순서 조정
    const order = ['서울', '경기', '부산', '인천', '대구', '대전', '광주', '울산'];
    return order.filter(c => citySet.has(c));
  }, []);

  // 선택된 시/도의 구/군 목록
  const districts = useMemo(() => {
    if (!selectedCity) return [];
    return TARGET_REGIONS.filter(r => r.city === selectedCity);
  }, [selectedCity]);

  return (
    <div className="w-full">
      {/* 1단계: 시/도 선택 */}
      <div className="mb-12">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" /> STEP 01. 내 거주 시/도 선택
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`
                px-6 py-4 rounded-3xl text-sm font-black transition-all duration-300 border-2
                ${selectedCity === city 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105' 
                  : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/30'}
              `}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* 2단계: 구/군 선택 */}
      <AnimatePresence mode="wait">
        {selectedCity ? (
          <motion.div
            key={selectedCity}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8 md:p-12 bg-slate-50 border border-slate-100 rounded-[3rem]"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="text-blue-600">{selectedCity}</span> 전체 구/군 목록
                  <span className="text-sm font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter">
                    {districts.length} Locations Found
                  </span>
                </h4>
                <p className="text-slate-500 mt-2 font-medium">검색 결과에서 본인이 거주하는 구/군을 선택하세요.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="지역 이름으로 검색..." 
                  className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full md:w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {districts.map((region) => (
                <Link
                  key={region.code}
                  href={`/welfare/${region.code}-${policy.slug}`}
                  className="group relative flex flex-col gap-1 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{region.city}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {region.name}
                  </span>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">당일 안내 가능</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">위에 있는 시/도를 먼저 선택해주세요.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
