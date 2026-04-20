'use client';

import { Fragment, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

const SEOUL_DISTRICTS = [
  '관악구', '마포구', '강남구', '송파구', '강서구', '노원구', '은평구',
  '강동구', '양천구', '성북구', '구로구', '서초구', '영등포구', '동작구',
  '중랑구', '서대문구', '동대문구', '광진구', '강북구', '성동구', '용산구',
  '금천구', '도봉구', '종로구', '중구',
];

const GYEONGGI_CITIES = ['수원시', '성남시', '고양시', '용인시', '부천시'];

export type HouseholdType = 'single' | 'couple' | 'family';
export type IncomeLevel = 'low' | 'medium' | 'high';
export type Province = '서울' | '경기';

export interface SituationData {
  province: Province;
  district: string;
  age: number;
  householdType: HouseholdType;
  incomeLevel: IncomeLevel;
}

const JOURNEY_STEPS = ['상황 입력', '퀴즈 풀기', '인증서'];
const TOTAL_STEPS = 4;

interface Props {
  onSubmit: (data: SituationData) => void;
}

export default function SituationInput({ onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState<Partial<SituationData>>({
    province: '서울',
    age: 28,
  });

  const districts = situation.province === '서울' ? SEOUL_DISTRICTS : GYEONGGI_CITIES;

  const canProceed = () => {
    switch (step) {
      case 1: return !!situation.district;
      case 2: return !!situation.age;
      case 3: return !!situation.householdType;
      case 4: return !!situation.incomeLevel;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      onSubmit(situation as SituationData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Journey indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {JOURNEY_STEPS.map((label, i) => (
          <Fragment key={label}>
            <div className={`flex items-center gap-1.5 ${i === 0 ? 'text-blue-600' : 'text-slate-300'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i + 1}
              </div>
              <span className="text-xs font-bold hidden sm:inline">{label}</span>
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-slate-200" />
            )}
          </Fragment>
        ))}
      </div>

      {/* Step progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold text-slate-400">{step} / {TOTAL_STEPS} 단계</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5 overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] font-black text-blue-500">
              <Sparkles className="w-4 h-4" />
              복지 퀴즈 — 내 상황 입력
            </div>

            {/* Step 1: Region */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  <span className="text-blue-600">어느 지역</span>에<br />살고 계신가요?
                </h2>

                <div className="flex gap-2">
                  {(['서울', '경기'] as Province[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSituation({ ...situation, province: p, district: undefined })}
                      className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all ${
                        situation.province === p
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {districts.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSituation({ ...situation, district: d })}
                      className={`py-3 px-1 rounded-2xl font-bold text-sm transition-all ${
                        situation.district === d
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d.replace(/[구시]$/, '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Age */}
            {step === 2 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  <span className="text-blue-600">만 나이</span>가<br />어떻게 되시나요?
                </h2>
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <span className="text-6xl font-black text-blue-600">{situation.age}</span>
                    <span className="text-2xl font-bold text-slate-400 ml-2">세</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="65"
                    step="1"
                    value={situation.age}
                    onChange={(e) => setSituation({ ...situation, age: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>15세</span>
                    <span>65세</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Household type */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  <span className="text-blue-600">가구 형태</span>가<br />어떻게 되시나요?
                </h2>
                <div className="space-y-3">
                  {([
                    { value: 'single', icon: '🧑', label: '1인 가구', desc: '혼자 생활합니다' },
                    { value: 'couple', icon: '👫', label: '부부 / 신혼', desc: '배우자와 함께 생활합니다' },
                    { value: 'family', icon: '👨‍👩‍👧', label: '가족 (자녀 있음)', desc: '자녀와 함께 생활합니다' },
                  ] as { value: HouseholdType; icon: string; label: string; desc: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSituation({ ...situation, householdType: opt.value })}
                      className={`w-full p-5 rounded-[1.5rem] border-2 text-left transition-all flex items-center gap-4 ${
                        situation.householdType === opt.value
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-3xl">{opt.icon}</span>
                      <div>
                        <p className="font-black text-slate-900">{opt.label}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Income level */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  <span className="text-blue-600">월 소득</span>은<br />어느 정도인가요?
                </h2>
                <p className="text-sm text-slate-400 font-medium -mt-2">건강보험료 기준 대략적인 소득 수준을 선택하세요</p>
                <div className="space-y-3">
                  {([
                    {
                      value: 'low',
                      label: '저소득',
                      desc: '월 134만원 이하 (중위소득 60% 이하)',
                      badge: '대부분 혜택 가능',
                    },
                    {
                      value: 'medium',
                      label: '중간 소득',
                      desc: '월 135 ~ 260만원 (중위소득 60~120%)',
                      badge: '일부 혜택 가능',
                    },
                    {
                      value: 'high',
                      label: '평균 이상',
                      desc: '월 260만원 초과 (중위소득 120% 초과)',
                      badge: '선별 혜택 확인',
                    },
                  ] as { value: IncomeLevel; label: string; desc: string; badge: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSituation({ ...situation, incomeLevel: opt.value })}
                      className={`w-full p-5 rounded-[1.5rem] border-2 text-left transition-all flex items-center justify-between gap-3 ${
                        situation.incomeLevel === opt.value
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <p className="font-black text-slate-900">{opt.label}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{opt.desc}</p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                        situation.incomeLevel === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {opt.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-10">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-8 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-colors"
                >
                  이전
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
              >
                {step === TOTAL_STEPS ? '퀴즈 시작하기' : '다음'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 group-disabled:translate-x-0 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
