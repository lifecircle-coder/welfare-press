// src/components/welfare/YouthRentCalculator.tsx
'use client';

import { useState, useCallback } from 'react';

// ── 타입 정의 ──────────────────────────────────────────────────────────────────
interface CalculatorInput {
  age: string;
  monthlyIncome: string;   // 만원 단위
  hasProperty: 'yes' | 'no' | '';
  monthlyRent: string;     // 만원 단위
  deposit: string;         // 만원 단위
  isIndependent: 'yes' | 'no' | '';
}

interface CalculatorResult {
  eligible: boolean;
  monthlySupport: number;  // 월 지원금 (원)
  totalSupport: number;    // 총 지원금 (원, 최대 12개월)
  failReasons: string[];   // 탈락 사유
  passConditions: string[];// 충족 조건
}

// ── GA4 이벤트 전송 함수 ───────────────────────────────────────────────────────
function trackEvent(eventName: string, params: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
}

// ── 자격 판정 로직 (2024년 기준) ──────────────────────────────────────────────────
function calculateEligibility(input: CalculatorInput): CalculatorResult {
  const age = parseInt(input.age, 10);
  const monthlyIncome = parseInt(input.monthlyIncome, 10) * 10000;
  const monthlyRent = parseInt(input.monthlyRent, 10) * 10000;
  const deposit = parseInt(input.deposit, 10) * 10000;

  const failReasons: string[] = [];
  const passConditions: string[] = [];

  if (isNaN(age) || age < 19 || age > 34) {
    failReasons.push('연령 조건 미충족: 19세 이상 34세 이하여야 합니다.');
  } else {
    passConditions.push(`연령 조건 충족 (현재 ${age}세)`);
  }

  const INCOME_LIMIT = 1340000; // 1인 기준 중위 60%
  if (isNaN(monthlyIncome) || monthlyIncome > INCOME_LIMIT) {
    failReasons.push(`소득 조건 미충족: 월 소득이 134만원을 초과합니다.`);
  } else {
    passConditions.push(`소득 조건 충족 (월 ${(monthlyIncome / 10000).toFixed(0)}만원)`);
  }

  if (input.hasProperty === 'yes') {
    failReasons.push('무주택 조건 미충족: 본인 명의 부동산이 없어야 합니다.');
  } else if (input.hasProperty === 'no') {
    passConditions.push('무주택 조건 충족');
  }

  if (input.isIndependent === 'no') {
    failReasons.push('독립 거주 조건 미충족: 부모와 별도 거주 중이어야 합니다.');
  } else if (input.isIndependent === 'yes') {
    passConditions.push('독립 거주 조건 충족');
  }

  if (!isNaN(deposit) && deposit > 50000000) {
    failReasons.push('주거 조건 미충족: 보증금이 5천만원을 초과합니다.');
  } else if (!isNaN(deposit)) {
    passConditions.push(`보증금 조건 충족 (${(deposit / 10000).toFixed(0)}만원)`);
  }
  
  if (!isNaN(monthlyRent) && monthlyRent > 700000) {
    failReasons.push('주거 조건 미충족: 월세가 70만원을 초과합니다.');
  } else if (!isNaN(monthlyRent) && monthlyRent > 0) {
    passConditions.push(`월세 조건 충족 (${(monthlyRent / 10000).toFixed(0)}만원)`);
  }

  const eligible = failReasons.length === 0;

  return {
    eligible,
    monthlySupport: eligible ? 200000 : 0,
    totalSupport: eligible ? 2400000 : 0,
    failReasons,
    passConditions,
  };
}

export default function YouthRentCalculator({ regionName }: { regionName?: string }) {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [input, setInput] = useState<CalculatorInput>({
    age: '',
    monthlyIncome: '',
    hasProperty: '',
    monthlyRent: '',
    deposit: '',
    isIndependent: '',
  });
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const handleChange = (field: keyof CalculatorInput, value: string) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!input.age || !input.monthlyIncome || !input.hasProperty || !input.isIndependent || !input.monthlyRent || !input.deposit) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    const res = calculateEligibility(input);
    setResult(res);
    setStep('result');

    trackEvent('welfare_calculator_submit', {
      policy_type: 'youth_rent_support',
      region: regionName || '전국',
      eligible: res.eligible,
    });
  };

  const handleReset = () => {
    setStep('form');
    setResult(null);
    setInput({ age: '', monthlyIncome: '', hasProperty: '', monthlyRent: '', deposit: '', isIndependent: '' });
  };

  const handleShare = () => {
    const shareText = result?.eligible
      ? `나는 ${regionName || ''} 청년 월세 지원금 수혜 대상입니다! 연 최대 240만원 혜택을 받을 수 있어요.`
      : `청년 월세 지원금 대상 여부를 확인해봤어요.`;
    
    if (navigator.share) {
      navigator.share({ title: 'THE복지 결과 확인', text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`).then(() => alert('링크가 복사되었습니다!'));
    }

    trackEvent('calculator_share_click', {
      policy_type: 'youth_rent_support',
      region: regionName || '전국',
      eligible: result?.eligible ?? false,
    });
  };

  return (
    <div className="my-10 bg-white border-2 border-blue-500 rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl">📊</div>
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
            {regionName ? `${regionName} ` : ''}청년 월세 자격 판독기
          </h3>
          <p className="text-sm text-blue-600 font-medium mt-1">정규 소득/주거 기준 기반 자동 매칭</p>
        </div>
      </div>

      {step === 'form' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">내 나이 (만)</label>
            <input
              type="number"
              placeholder="예: 26"
              value={input.age}
              onChange={e => handleChange('age', e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">월 세전 소득 (만원)</label>
            <input
              type="number"
              placeholder="예: 120"
              value={input.monthlyIncome}
              onChange={e => handleChange('monthlyIncome', e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 col-span-full">
            <label className="text-sm font-bold text-gray-700 ml-1">현재 본인 명의 부동산을 소유하고 있나요?</label>
            <div className="flex gap-3">
              {(['yes', 'no'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => handleChange('hasProperty', val)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                    input.hasProperty === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {val === 'yes' ? '네, 있어요' : '아니요, 없어요'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 col-span-full">
            <label className="text-sm font-bold text-gray-700 ml-1">부모님과 따로 살고 있나요?</label>
            <div className="flex gap-3">
              {(['yes', 'no'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => handleChange('isIndependent', val)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                    input.isIndependent === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {val === 'yes' ? '네, 따로 살아요' : '아니요, 같이 살아요'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">월세 (만원)</label>
            <input
              type="number"
              placeholder="예: 45"
              value={input.monthlyRent}
              onChange={e => handleChange('monthlyRent', e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">보증금 (만원)</label>
            <input
              type="number"
              placeholder="예: 1000"
              value={input.deposit}
              onChange={e => handleChange('deposit', e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="col-span-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-lg shadow-lg hover:shadow-blue-200/50 transition-all"
          >
            30초 만에 결과 확인하기 🚀
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="text-center space-y-6">
          <div className={`py-8 rounded-3xl ${result.eligible ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className="text-6xl mb-4 block">{result.eligible ? '👑' : '🚧'}</span>
            <h4 className={`text-2xl font-black ${result.eligible ? 'text-green-700' : 'text-red-700'}`}>
              {result.eligible ? '축하합니다! 수혜 대상입니다' : '아쉽게도 현재는 대상이 아니에요'}
            </h4>
            {result.eligible && (
              <div className="mt-4">
                <p className="text-4xl font-extrabold text-green-600">연 최대 240만원</p>
                <p className="text-sm text-green-500 mt-1">월 20만원씩 12개월간 현금 지급</p>
              </div>
            )}
          </div>

          <div className="text-left space-y-3">
            {result.passConditions.map((c, i) => (
              <div key={i} className="flex gap-3 text-sm text-green-700 font-semibold bg-green-50/50 p-4 rounded-xl border border-green-100">
                <span>✅</span> {c}
              </div>
            ))}
            {result.failReasons.map((r, i) => (
              <div key={i} className="flex gap-3 text-sm text-red-700 font-semibold bg-red-50/50 p-4 rounded-xl border border-red-100">
                <span>❌</span> {r}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleShare} className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-4 rounded-2xl transition-all">
              친구에게 공유 📧
            </button>
            <button onClick={handleReset} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all">
              다시 계산하기
            </button>
            {result.eligible && (
              <a href="https://bokjiro.go.kr" target="_blank" className="col-span-full bg-blue-600 text-white font-black py-5 rounded-2xl text-lg">
                지금 복지로에서 신청하기 →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
