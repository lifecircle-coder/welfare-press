// src/components/welfare/LocalWelfareGuide.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Users, ShieldCheck, MapPin, ExternalLink, HelpCircle } from 'lucide-react';

interface LocalWelfareGuideProps {
  regionName: string;
  phoneNumber: string;
  cityName: string;
}

export default function LocalWelfareGuide({ regionName, phoneNumber, cityName }: LocalWelfareGuideProps) {
  const tips = [
    {
      title: '청약저축 가입 여부 확인',
      desc: '신청 시점에 청약통장에 가입되어 있어야 합니다. 납입 횟수나 금액은 상관없으니 지금 바로 은행에서 행령하세요.',
      icon: <ShieldCheck className="w-5 h-5 text-green-500" />
    },
    {
      title: '임대차계약서 확정일자',
      desc: '확정일자가 찍힌 계약서가 필수입니다. 관할 주민센터나 온라인 등기소에서 즉시 발급 가능합니다.',
      icon: <MapPin className="w-5 h-5 text-blue-500" />
    },
    {
      title: '원가구 소득 증빙',
      desc: '부모님과 따로 살더라도 부모님 소득이 기준에 포함될 수 있습니다. 가족관계증명서를 미리 준비하세요.',
      icon: <Users className="w-5 h-5 text-purple-500" />
    }
  ];

  return (
    <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Contact Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border border-slate-100"
      >
        <div className="flex items-center gap-2 mb-8 uppercase tracking-widest text-[10px] font-black text-slate-400">
          <HelpCircle className="w-4 h-4" /> Support Contact
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-4">
          궁금한 점은 <span className="text-blue-600">{regionName}</span><br />담당자에게 바로 물어보세요
        </h3>
        
        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
          인터넷 정보만으로는 내 상황에 맞는 정확한 진단이 어려울 수 있습니다. {regionName} 담당 부서에 직접 문의하면 가장 정확하고 빠른 답변을 얻을 수 있습니다.
        </p>

        <div className="space-y-4">
          <a 
            href={`tel:${phoneNumber}`}
            className="flex items-center justify-between w-full p-6 bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Phone className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-400 uppercase">{regionName} 복지 상담</p>
                <p className="text-xl font-black text-slate-900">{phoneNumber}</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
          </a>
          
          <div className="p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400">
              운영시간: 평일 09:00 ~ 18:00 (주말 및 공휴일 제외)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Expert Tips Section */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50"
      >
        <div className="flex items-center gap-2 mb-8 uppercase tracking-widest text-[10px] font-black text-blue-500">
          <Sparkles className="w-4 h-4" /> Expert Application Tips
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-8">
          {regionName} 청년들을 위한<br /><span className="text-blue-600">성공적인 신청 팁</span>
        </h3>

        <div className="space-y-8">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="mt-1">{tip.icon}</div>
              <div>
                <h4 className="font-black text-slate-900 mb-1">{tip.title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
