// src/components/welfare/DistrictBenefitSuggestor.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getYouthPolicyList } from '@/lib/api/publicData';
import { WelfareService } from '@/lib/api/publicData';
import { Sparkles, ArrowRight, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DistrictBenefitSuggestorProps {
  zipCd: string;
  regionName: string;
  excludePolicyName?: string;
}

export default function DistrictBenefitSuggestor({ zipCd, regionName, excludePolicyName }: DistrictBenefitSuggestorProps) {
  const [policies, setPolicies] = useState<WelfareService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocalPolicies = async () => {
      setLoading(true);
      try {
        // 해당 지역(zipCd)의 정책들 가져오기 (주거 외에도 전체 분야 노출하여 정보성 강화)
        const data = await getYouthPolicyList(1, 10, '', zipCd);
        // 현재 정책 제외 및 최대 3개 선별
        const filtered = data
          .filter(p => !p.servNm.includes(excludePolicyName || ''))
          .slice(0, 3);
        setPolicies(filtered);
      } catch (err) {
        console.error('Failed to fetch suggested policies:', err);
      } finally {
        setLoading(false);
      }
    };

    if (zipCd) fetchLocalPolicies();
  }, [zipCd, excludePolicyName]);

  if (loading) {
    return (
      <div className="mt-12 space-y-4">
        <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-50 animate-pulse rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (policies.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900">
          {regionName} 청년이 <span className="text-indigo-600">함께 체크</span>할 혜택
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policies.map((policy, idx) => (
          <motion.a
            key={policy.servId}
            href={policy.servDtlLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group block p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all"
          >
            <div className="mb-4 flex justify-between items-start">
              <span className="inline-flex px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {policy.jurMnofNm || '지자체 혜택'}
              </span>
              <Building2 className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            
            <h4 className="text-base font-bold text-slate-900 mb-3 truncate group-hover:text-indigo-600 transition-colors">
              {policy.servNm}
            </h4>
            
            <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-2 font-medium">
              {policy.servDgst || '상세 정보를 확인하여 혜택을 놓치지 마세요.'}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] font-black text-indigo-600 group-hover:underline flex items-center gap-1 transition-all">
                상세보기 <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
