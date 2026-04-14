// src/components/welfare/WelfareDiagnoser.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RefreshCcw, 
  Sparkles, 
  Home, 
  Users, 
  Wallet, 
  Calendar,
  Building2,
  AlertCircle
} from 'lucide-react';
import { WelfarePolicyData } from '@/lib/welfare-data';
import ViralShareCard from './ViralShareCard';

interface DiagnoserInput {
  age: number;
  isStudent: boolean;
  isWorking: boolean;
  monthlyIncome: number; // 만원 단위
  deposit: number;      // 만원 단위
  monthlyRent: number;   // 만원 단위
  hasHouse: boolean;
  isIndependent: boolean;
  parentIncome: number;  // 만원 단위 (선택 사항)
}

interface MatchResult {
  isMatch: boolean;
  reasons: { type: 'pass' | 'fail'; text: string }[];
  userName: string;
}

export default function WelfareDiagnoser({ 
  regionName, 
  policy 
}: { 
  regionName: string, 
  policy: WelfarePolicyData 
}) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<DiagnoserInput>({
    age: 25,
    isStudent: false,
    isWorking: true,
    monthlyIncome: 150,
    deposit: 1000,
    monthlyRent: 50,
    hasHouse: false,
    isIndependent: true,
    parentIncome: 450,
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // 청년월세지원 전용 정밀 판정 엔진
  const result: MatchResult = useMemo(() => {
    const reasons: { type: 'pass' | 'fail'; text: string }[] = [];
    let isMatch = true;

    // 1. 연령 (만 19~34세)
    if (input.age >= 19 && input.age <= 34) {
      reasons.push({ type: 'pass', text: `연령 기준 이상 없음 (만 ${input.age}세)` });
    } else {
      isMatch = false;
      reasons.push({ type: 'fail', text: '정책 대상 연령(만 19~34세)이 아닙니다.' });
    }

    // 2. 주거 요건 (보증금 5천 & 월세 70이하)
    if (input.deposit <= 5000 && input.monthlyRent <= 70) {
      reasons.push({ type: 'pass', text: '임차보증금 및 월세액 요건 충족' });
    } else {
      isMatch = false;
      reasons.push({ type: 'fail', text: '임차보증금(5천만) 또는 월세(70만) 기준을 초과합니다.' });
    }

    // 3. 무주택 여부
    if (!input.hasHouse) {
      reasons.push({ type: 'pass', text: '무주택자 자격 확인 완료' });
    } else {
      isMatch = false;
      reasons.push({ type: 'fail', text: '주택 소유자는 지원 대상에서 제외됩니다.' });
    }

    // 4. 소득 기준 (청년가구 중위 60% 이하 - 약 134만원)
    if (input.monthlyIncome <= 134) {
      reasons.push({ type: 'pass', text: '청년가구 소득 기준 충족 (월 134만원 이하)' });
    } else {
      isMatch = false;
      reasons.push({ type: 'fail', text: '청년가구 소득 기준 초과 (중위 60% 초과)' });
    }

    return { isMatch, reasons, userName: '청년' };
  }, [input]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      setIsCalculating(true);
      setTimeout(() => {
        setIsCalculating(false);
        setStep(5);
      }, 1500);
    }
  };

  const handleBack = () => setStep(step - 1);

  const reset = () => {
    setStep(1);
    setInput({
      age: 25,
      isStudent: false,
      isWorking: true,
      monthlyIncome: 150,
      deposit: 1000,
      monthlyRent: 50,
      hasHouse: false,
      isIndependent: true,
      parentIncome: 450,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step <= 4 && (
          <motion.div
            key="diagnoser-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5 overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center gap-2 mb-8 uppercase tracking-widest text-[10px] font-black text-blue-500">
                <Sparkles className="w-4 h-4" /> Eligibility Checker
              </div>

              {step === 1 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    먼저 <span className="text-blue-600">본인의 기본 정보</span>를<br />입력해 주세요
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                         <Calendar className="w-4 h-4" /> 현재 만 나이
                      </label>
                      <input 
                        type="range" min="15" max="45" step="1"
                        value={input.age}
                        onChange={(e) => setInput({...input, age: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xl font-black text-slate-900">
                        <span>15세</span>
                        <span className="text-blue-600">만 {input.age}세</span>
                        <span>45세</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    현재 <span className="text-blue-600">거주 중인 주택</span>의<br />임대차 정보를 알려주세요
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-500 transition-all">
                        <label className="text-xs font-bold text-slate-400 block mb-2">보증금 (만원)</label>
                        <input 
                          type="number"
                          value={input.deposit}
                          onChange={(e) => setInput({...input, deposit: parseInt(e.target.value)})}
                          className="text-2xl font-black w-full outline-none bg-transparent"
                        />
                      </div>
                      <div className="p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-500 transition-all">
                        <label className="text-xs font-bold text-slate-400 block mb-2">월세 (만원)</label>
                        <input 
                          type="number"
                          value={input.monthlyRent}
                          onChange={(e) => setInput({...input, monthlyRent: parseInt(e.target.value)})}
                          className="text-2xl font-black w-full outline-none bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                       <AlertCircle className="w-4 h-4 text-slate-400" />
                       <p className="text-[11px] font-bold text-slate-500">전세 거주자나 주택 소유주는 지원 대상에서 제외됩니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    본인의 <span className="text-blue-600">월 평균 건강보험료</span><br />또는 소득을 선택하세요
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: '낮음 (월 134만원 이하)', val: 100 },
                      { label: '중간 (월 200만원 이하)', val: 180 },
                      { label: '높음 (월 200만원 초과)', val: 300 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setInput({...input, monthlyIncome: opt.val})}
                        className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all flex justify-between items-center ${
                          input.monthlyIncome === opt.val ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <span className="font-bold text-slate-900">{opt.label}</span>
                        {input.monthlyIncome === opt.val && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    마지막으로<br /><span className="text-blue-600">무주택 여부</span>를 확인합니다
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setInput({...input, hasHouse: false})}
                      className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                        !input.hasHouse ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <Home className={`w-8 h-8 ${!input.hasHouse ? 'text-blue-600' : 'text-slate-300'}`} />
                      <span className="font-black">무주택</span>
                    </button>
                    <button
                      onClick={() => setInput({...input, hasHouse: true})}
                      className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                        input.hasHouse ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <Building2 className={`w-8 h-8 ${input.hasHouse ? 'text-blue-600' : 'text-slate-300'}`} />
                      <span className="font-black">주택소유</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-12">
                {step > 1 && (
                  <button 
                    onClick={handleBack}
                    className="px-8 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    이전으로
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  disabled={isCalculating}
                  className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                >
                  {isCalculating ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {step === 4 ? '판독 결과 확인하기' : '다음 단계로'}
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="diagnoser-result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Detailed Result Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5 p-8 md:p-12 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                  result.isMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {result.isMatch ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {result.isMatch ? 'Qualified' : 'Not Qualified'}
                </div>
                <button 
                  onClick={reset}
                  className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-8 leading-tight">
                {result.isMatch ? (
                  <>축하합니다! <span className="text-blue-600">혜택 대상</span> 가망성이 매우 높습니다</>
                ) : (
                  <>아쉽지만 소득 또는 거주 요건이<br /><span className="text-red-500">기준과 조금 다릅니다</span></>
                )}
              </h2>

              <div className="space-y-4 mb-10">
                {result.reasons.map((r, i) => (
                  <div key={i} className="flex gap-3 items-start p-4 bg-slate-50 rounded-2xl">
                    {r.type === 'pass' ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                    <span className="text-sm font-bold text-slate-600">{r.text}</span>
                  </div>
                ))}
              </div>

              {result.isMatch && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-blue-600 text-white p-8 rounded-[2rem] text-center"
                 >
                   <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-2">Estimated Amount</p>
                   <h3 className="text-4xl font-black mb-6">최대 240만원</h3>
                   <a 
                     href={policy.applicationUrl} 
                     target="_blank" 
                     className="block w-full bg-white text-blue-600 py-4 rounded-xl font-black shadow-lg shadow-blue-700/20 active:scale-95 transition-all"
                   >
                     공식 신청 페이지로 이동
                   </a>
                 </motion.div>
              )}
            </div>

            {/* Viral Card (Result Graduation) */}
            {result.isMatch && (
              <ViralShareCard 
                regionName={regionName} 
                policyName={policy.policyName}
                maxAmount="240만원"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
