'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Link2, CheckCircle2, Trophy, Sparkles, Loader2 } from 'lucide-react';
import { QuizResult } from './QuizFlow';

const HOUSEHOLD_LABEL: Record<string, string> = {
  single: '1인 가구',
  couple: '부부·신혼',
  family: '가족',
};

const INCOME_LABEL: Record<string, string> = {
  low: '저소득',
  medium: '중간 소득',
  high: '평균 이상',
};

interface Props {
  result: QuizResult;
}

export default function Certificate({ result }: Props) {
  const { situation, eligiblePolicies, totalBenefitAmount, answers, questions } = result;
  const correctCount = answers.filter((a) => a.is_correct).length;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  const regionLabel = `${situation.province} ${situation.district}`;
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const savedRef = useRef(false);

  // Save session to DB once on mount
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    async function saveSession() {
      try {
        const res = await fetch('/api/welfare-quiz/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            situation,
            answers,
            score: correctCount,
            total_questions: questions.length,
            eligible_policies: eligiblePolicies,
            total_benefit_amount: totalBenefitAmount,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.session_token);
          // Persist token for revisit
          try {
            localStorage.setItem('wb_quiz_token', data.session_token);
          } catch {}
        }
      } catch {
        // Non-critical — certificate still shows
      } finally {
        setSaved(true);
      }
    }

    saveSession();
  }, []);

  const shareText = `[${regionLabel} 복지 퀴즈 완료! 🏆]\n나는 연간 최대 ${totalBenefitAmount.toLocaleString()}만원 혜택을 받을 수 있어요!\n내 결과 확인하기 → https://thebok.co.kr/welfare-quiz`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${regionLabel} 복지 퀴즈 완료!`,
          text: shareText,
          url: 'https://thebok.co.kr/welfare-quiz',
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Gradient border card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative p-[2px] rounded-[2.5rem] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-blue-500/25"
      >
        <div className="bg-slate-900 rounded-[2.4rem] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-400 text-[10px] font-black tracking-widest uppercase">복지 혜택 인증서</p>
                <p className="text-slate-500 text-[10px] font-bold">
                  {new Date().toLocaleDateString('ko-KR')} 발급
                </p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>

          {/* Main benefit amount */}
          <div className="px-8 pb-6">
            <p className="text-slate-400 text-xs font-bold mb-1">
              <span className="text-white font-black">{regionLabel}</span>에서 확인된 혜택
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">연간 최대</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-none">
              <span className="text-blue-400">{totalBenefitAmount > 0 ? `${totalBenefitAmount.toLocaleString()}만원` : '학습 완료'}</span>
            </h2>
          </div>

          {/* Situation tags */}
          <div className="px-8 pb-6 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-300">
              만 {situation.age}세
            </span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-300">
              {HOUSEHOLD_LABEL[situation.householdType]}
            </span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-300">
              {INCOME_LABEL[situation.incomeLevel]}
            </span>
            <span className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded-full text-xs font-black text-blue-300">
              정답률 {scorePercent}%
            </span>
          </div>

          {/* Eligible policies */}
          {eligiblePolicies.length > 0 ? (
            <div className="px-8 pb-6 space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                퀴즈 통과 정책
              </p>
              {eligiblePolicies.map((policy) => (
                <div
                  key={policy.policy_id}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 text-sm font-black truncate">{policy.policy_name}</p>
                    {policy.benefit_description && (
                      <p className="text-slate-500 text-[11px] font-medium truncate">
                        {policy.benefit_description}
                      </p>
                    )}
                  </div>
                  {policy.max_benefit_amount !== null && (
                    <span className="text-xs font-black text-blue-400 flex-shrink-0 whitespace-nowrap">
                      {policy.max_benefit_amount.toLocaleString()}만원
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-8 pb-6">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
                <p className="text-slate-400 text-sm font-bold">
                  퀴즈를 더 공부하고 다시 도전해보세요!
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  모든 문제를 맞히면 인증서가 발급됩니다
                </p>
              </div>
            </div>
          )}

          {/* Share buttons */}
          <div className="px-8 pb-8 space-y-3">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              친구에게 공유하기
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-slate-200 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  복사 완료!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  내 결과 링크 복사
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 border-t border-white/5 pt-4 flex items-center justify-between">
            <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">
              Powered by THE복지
            </p>
            {!saved ? (
              <span className="flex items-center gap-1 text-slate-600 text-[10px]">
                <Loader2 className="w-3 h-3 animate-spin" /> 저장 중
              </span>
            ) : sessionId ? (
              <span className="text-slate-600 text-[10px] font-bold">✓ 인증서 저장됨</span>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
