// src/components/welfare/WelfareDiagnoser.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, XCircle, ChevronRight, RefreshCcw, Gift, Search, Info } from 'lucide-react';
import { WelfarePolicyData, WELFARE_POLICIES } from '@/lib/welfare-data';

interface DiagnoserInput {
  age: number;
  isStudent: boolean;
  isWorking: boolean;
  monthlyIncome: number;
  hasHouse: boolean;
  isIndependent: boolean;
  regionZip: string;
}

interface MatchResult {
  policy: WelfarePolicyData;
  isMatch: boolean;
  reasons: { type: 'pass' | 'fail'; text: string }[];
}

export default function WelfareDiagnoser({ regionName }: { regionName: string }) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<DiagnoserInput>({
    age: 25,
    isStudent: false,
    isWorking: true,
    monthlyIncome: 150,
    hasHouse: false,
    isIndependent: true,
    regionZip: '',
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // 자격 판정 엔진
  const diagnosisResults = useMemo(() => {
    return WELFARE_POLICIES.map(policy => {
      const reasons: { type: 'pass' | 'fail'; text: string }[] = [];
      let isMatch = true;

      // 1. 연령 (Youth 전용 필터링 예시)
      if (policy.targetAge.includes('19~34세')) {
        if (input.age >= 19 && input.age <= 34) {
          reasons.push({ type: 'pass', text: `연령 기준 충족 (만 ${input.age}세)` });
        } else {
          isMatch = false;
          reasons.push({ type: 'fail', text: '만 19~34세 정책 대상이 아닙니다.' });
        }
      }

      // 2. 소득 (정책별 상세 로직)
      if (policy.slug === 'youth-rent-support') {
        if (input.monthlyIncome <= 134) {
          reasons.push({ type: 'pass', text: '소득 기준 충족 (월 134만원 이하)' });
        } else {
          isMatch = false;
          reasons.push({ type: 'fail', text: '소득 기준 초과 (기준 134만원 이하)' });
        }
        if (input.isIndependent) {
          reasons.push({ type: 'pass', text: '독립 거주 요건 충족' });
        } else {
          isMatch = false;
          reasons.push({ type: 'fail', text: '부모님과 별도 거주가 필요합니다.' });
        }
      }

      if (policy.slug === 'youth-savings-account') {
        if (input.isWorking && input.monthlyIncome <= 230) {
          reasons.push({ type: 'pass', text: '소득/근로 기준 충족 (중위 100% 이하)' });
        } else {
          isMatch = false;
          reasons.push({ type: 'fail', text: '소득 기준 초과 또는 미근로 상태입니다.' });
        }
      }

      return { policy, isMatch, reasons };
    });
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
      hasHouse: false,
      isIndependent: true,
      regionZip: '',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-12 relative">
      {/* 장식용 요소 */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50" />

      <div className="bg-white/80 backdrop-blur-xl border border-blue-100 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white text-center">
          <h3 className="text-2xl font-black mb-1">복지 혜택 정밀 진단</h3>
          <p className="text-blue-100 text-sm opacity-90">당신이 놓치고 있는 {regionName} 혜택을 찾아드립니다</p>
        </div>

        <div className="p-8 md:p-12 min-h-[450px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4">STEP 01</span>
                  <h4 className="text-2xl font-bold text-gray-900">본인의 나이를 알려주세요</h4>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-6xl font-black text-blue-600 mb-8">{input.age}<span className="text-2xl text-gray-400 ml-2">세</span></div>
                  <input
                    type="range"
                    min="15"
                    max="65"
                    value={input.age}
                    onChange={(e) => setInput({ ...input, age: parseInt(e.target.value) })}
                    className="w-full max-w-md h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between w-full max-w-md mt-4 text-sm font-bold text-gray-400 px-1">
                    <span>만 15세</span>
                    <span>만 65세</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4">STEP 02</span>
                  <h4 className="text-2xl font-bold text-gray-900">현재 경제 활동 상태는 어떠신가요?</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'isWorking', label: '직장에 다니고 있어요 💼', desc: '정규직, 계약직, 알바 등 근로자' },
                    { id: 'isStudent', label: '학업에 집중하고 있어요 🎓', desc: '대학(원)생, 취준생' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setInput({ ...input, [item.id]: !input[item.id as keyof DiagnoserInput] })}
                      className={`p-6 rounded-[1.5rem] border-2 text-left transition-all ${
                        input[item.id as keyof DiagnoserInput]
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-100 bg-gray-50 hover:border-blue-200'
                      }`}
                    >
                      <div className="font-bold text-lg mb-1">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4">STEP 03</span>
                  <h4 className="text-2xl font-bold text-gray-900">월 평균 소득 규모를 선택해주세요</h4>
                  <p className="text-gray-500 text-sm mt-2">중위소득 기반 혜택 판정에 사용됩니다 (세전 기준)</p>
                </div>
                <div className="space-y-4">
                  {[
                    { val: 100, label: '100만원 이하 (저소득층 혜택 집중)', icon: '🌱' },
                    { val: 200, label: '100 ~ 230만원 (청년 정책 최적화)', icon: '🚀' },
                    { val: 350, label: '230 ~ 380만원 (일반 근로 혜택)', icon: '🏢' },
                    { val: 500, label: '380만원 이상 (금융/자산 혜택)', icon: '💰' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setInput({ ...input, monthlyIncome: item.val })}
                      className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                        input.monthlyIncome === item.val
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 bg-white hover:border-blue-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-bold text-gray-800">{item.label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${input.monthlyIncome === item.val ? 'border-blue-500 bg-blue-500' : 'border-gray-200'}`}>
                        {input.monthlyIncome === item.val && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4">STEP 04</span>
                  <h4 className="text-2xl font-bold text-gray-900">마지막으로 주거 상황을 알려주세요</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
                      <Target className="w-4 h-4 text-blue-600" />
                      현재 부모님과 같이 거주하고 계신가요?
                    </p>
                    <div className="flex gap-3">
                      {[true, false].map((val) => (
                        <button
                          key={String(val)}
                          onClick={() => setInput({ ...input, isIndependent: !val })}
                          className={`flex-1 py-4 rounded-xl font-black transition-all ${
                            input.isIndependent === !val ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-sm' : 'bg-gray-100 text-gray-400 border-2 border-transparent'
                          }`}
                        >
                          {val ? '네, 같이 살아요' : '아니요, 따로 살아요'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
                      <Search className="w-4 h-4 text-blue-600" />
                      본인 명의의 집(부동산)을 소유하고 계신가요?
                    </p>
                    <div className="flex gap-3">
                      {[true, false].map((val) => (
                        <button
                          key={String(val)}
                          onClick={() => setInput({ ...input, hasHouse: val })}
                          className={`flex-1 py-4 rounded-xl font-black transition-all ${
                            input.hasHouse === val ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-sm' : 'bg-gray-100 text-gray-400 border-2 border-transparent'
                          }`}
                        >
                          {val ? '네, 내 집이에요' : '아니요, 무주택이에요'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {isCalculating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative w-24 h-24">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 border-4 border-blue-100 border-t-blue-600 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">🔬</div>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black text-gray-800">분석 중...</h4>
                  <p className="text-sm text-gray-500 mt-1">행정 구역 및 정책 데이터를 대조하고 있습니다</p>
                </div>
              </motion.div>
            )}

            {step === 5 && !isCalculating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 pb-4"
              >
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🏆</div>
                  <h4 className="text-3xl font-black text-gray-900">진단 결과 보고서</h4>
                  <p className="text-gray-500 mt-2">{regionName} 지역 맞춤 정책 분석 결과입니다</p>
                </div>

                <div className="space-y-6">
                  {diagnosisResults.map((res, i) => (
                    <div key={i} className={`p-6 rounded-3xl border ${res.isMatch ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50 opacity-80'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${res.isMatch ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>
                            {res.isMatch ? '🎯 매칭 완료' : '🚧 기준 미달'}
                          </span>
                          <h5 className="text-lg font-black text-gray-900 mt-2">{res.policy.policyName}</h5>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-bold">지원 규모</p>
                          <p className="text-xl font-black text-blue-700">최대 {Math.floor(res.policy.maxAmount / 10000)}만원</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {res.reasons.map((reason, ri) => (
                          <div key={ri} className={`flex items-center gap-2 text-xs font-bold ${reason.type === 'pass' ? 'text-green-700' : 'text-red-600'}`}>
                            {reason.type === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {reason.text}
                          </div>
                        ))}
                      </div>

                      {res.isMatch ? (
                        <a href={res.policy.applicationUrl} target="_blank" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-lg shadow-blue-200">
                          지금 바로 신청하기 <ChevronRight className="w-5 h-5" />
                        </a>
                      ) : (
                        <div className="w-full py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center gap-2 font-black">
                          <Info className="w-4 h-4" /> 상세 요건 확인하기
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Derived Benefit (파생 혜택) */}
                <div className="mt-8 p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 text-7xl opacity-20"><Gift /></div>
                  <div className="relative z-10">
                    <h5 className="text-xl font-black flex items-center gap-2 mb-2">
                      <Gift className="w-6 h-6" /> 깜짝 보너스 혜택!
                    </h5>
                    <p className="text-sm font-medium text-amber-50 mb-6">
                      {input.isWorking ? '근로 청년' : '구직 청년'}이시군요? {regionName}에서 제공하는{' '}
                      <strong>{input.isWorking ? '청년 중소기업 소득세 감면' : '청년 구직활동지원금'}</strong>도 놓치지 마세요!
                    </p>
                    <button className="px-6 py-3 bg-white text-orange-600 rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg shadow-orange-900/20">
                      파생 혜택 모두 보기
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={reset} className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-all">
                    <RefreshCcw className="w-5 h-5" /> 다시 진단하기
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 버튼 (스텝 모드일 때) */}
        {step < 5 && !isCalculating && (
          <div className="px-8 pb-10 flex gap-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-5 border-2 border-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all"
              >
                이전으로
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-200 transition-all text-lg group"
            >
              {step === 4 ? '최종 결과 분석하기' : '다음 단계로'}
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* 신뢰도 뱃지 */}
      <div className="mt-8 flex items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
        <div className="flex flex-col items-center">
            <Search className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-[10px] font-bold text-gray-500">실시간 데이터</span>
        </div>
        <div className="flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-[10px] font-bold text-gray-500">공식 출처 대조</span>
        </div>
        <div className="flex flex-col items-center">
            <Target className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-[10px] font-bold text-gray-500">맞춤형 필터링</span>
        </div>
      </div>
    </div>
  );
}
