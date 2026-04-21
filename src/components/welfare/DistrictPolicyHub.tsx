'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Sparkles, Flame } from 'lucide-react';

interface YouthPolicy {
  plcyNo: string;
  plcyNm: string;
  plcyExplnCn?: string;
  plcyBgngDt?: string;
  plcyEndDt?: string;
  refUrlAddr1?: string;
  polyReginNm?: string;
}

function getDday(dateStr?: string): number | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/[^0-9]/g, '').substring(0, 8);
  if (clean.length < 8) return null;
  const end = new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`);
  if (isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - today.getTime()) / 86400000);
}

function isRecentStart(dateStr?: string): boolean {
  if (!dateStr) return false;
  const clean = dateStr.replace(/[^0-9]/g, '').substring(0, 8);
  if (clean.length < 8) return false;
  const start = new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`);
  if (isNaN(start.getTime())) return false;
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return diff >= 0 && diff <= 30;
}

export default function DistrictPolicyHub({ regionName }: { regionName: string }) {
  const [policies, setPolicies] = useState<YouthPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public-data?type=YOUTH_LIST&zipCd=11000&numOfRows=100&pageNo=1')
      .then(r => r.json())
      .then(data => {
        const list: YouthPolicy[] = data?.result?.youthPolicyList || [];
        // 서울 키워드 필터링
        const seoulList = list.filter(p =>
          (p.polyReginNm || '').includes('서울') || (p.polyReginNm || '') === ''
        );
        setPolicies(seoulList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ddayPolicies = policies
    .filter(p => { const d = getDday(p.plcyEndDt); return d !== null && d >= 0 && d <= 60; })
    .sort((a, b) => (getDday(a.plcyEndDt) ?? 999) - (getDday(b.plcyEndDt) ?? 999))
    .slice(0, 5);

  const newPolicies = policies
    .filter(p => isRecentStart(p.plcyBgngDt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {[1, 2].map(i => (
          <div key={i} className="h-80 bg-slate-50 rounded-[2rem] animate-pulse border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
      {/* D-day 마감 임박 */}
      <div className="bg-red-50 rounded-[2rem] p-8 border border-red-100">
        <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-red-500 uppercase tracking-widest">
          <AlertCircle className="w-4 h-4" /> D-day 마감 임박
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-6">
          {regionName} 청년 마감 임박 정책
        </h3>
        {ddayPolicies.length > 0 ? (
          <div className="space-y-3">
            {ddayPolicies.map(p => {
              const d = getDday(p.plcyEndDt);
              return (
                <motion.a
                  key={p.plcyNo}
                  href={p.refUrlAddr1 || 'https://www.youthcenter.go.kr'}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-red-100 hover:border-red-400 hover:shadow-lg transition-all"
                >
                  <div className="flex-shrink-0 w-14 h-14 bg-red-500 text-white rounded-xl flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] font-black">D</span>
                    <span className="text-base font-black">{d === 0 ? '!' : `-${d}`}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                      {p.plcyNm}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.plcyExplnCn}</p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            현재 60일 이내 마감 임박 정책이 없습니다.
          </div>
        )}
      </div>

      {/* 새로 시작된 정책 */}
      <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100">
        <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> 새로 시작된 정책
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-6">
          최근 30일 신규 시작 정책
        </h3>
        {newPolicies.length > 0 ? (
          <div className="space-y-3">
            {newPolicies.map(p => (
              <motion.a
                key={p.plcyNo}
                href={p.refUrlAddr1 || 'https://www.youthcenter.go.kr'}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-400 hover:shadow-lg transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {p.plcyNm}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.plcyExplnCn}</p>
                  {p.plcyBgngDt && (
                    <span className="text-[10px] font-black text-emerald-600 mt-1.5 inline-block">
                      {p.plcyBgngDt.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')} 시작
                    </span>
                  )}
                </div>
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            최근 신규 시작된 정책이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
