'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCcw, Trophy, ChevronRight } from 'lucide-react';
import { QuizResult } from './QuizFlow';

interface Props {
  result: QuizResult;
  onRestart: () => void;
  onCertificate: () => void;
}

export default function QuizResultScreen({ result, onRestart, onCertificate }: Props) {
  const { answers, questions, situation, totalBenefitAmount, eligiblePolicies } = result;
  const correctCount = answers.filter((a) => a.is_correct).length;
  const total = questions.length;
  const scorePercent = Math.round((correctCount / total) * 100);

  const policyIds = [...new Set(questions.map((q) => q.policy_id))];
  const policyResults = policyIds.map((pid) => {
    const policyQs = questions.filter((q) => q.policy_id === pid);
    const policyAs = answers.filter((a) => a.policy_id === pid);
    const policy = policyQs[0];
    const correctInPolicy = policyAs.filter((a) => a.is_correct).length;
    const isEligible = eligiblePolicies.some((p) => p.policy_id === pid);
    return { policy, correctInPolicy, total: policyQs.length, isEligible };
  });

  const isGoodScore = scorePercent >= 60;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-blue-500 uppercase tracking-widest">
            <Trophy className="w-4 h-4" /> 퀴즈 완료
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2">
            {isGoodScore ? (
              <>
                <span className="text-blue-600">{situation.district}</span>에서<br />
                복지 고수시네요! 🎉
              </>
            ) : (
              <>
                퀴즈 결과를 확인하세요<br />
                <span className="text-blue-600">다음엔 더 잘하실 수 있어요</span>
              </>
            )}
          </h2>

          {/* Score */}
          <div className="mt-8 flex items-end gap-4">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">정답률</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900">{scorePercent}</span>
                <span className="text-xl font-bold text-slate-400">%</span>
              </div>
            </div>
            <div className="h-14 w-px bg-slate-100" />
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">정답 수</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-blue-600">{correctCount}</span>
                <span className="text-xl font-bold text-slate-400">/ {total}</span>
              </div>
            </div>
            {totalBenefitAmount > 0 && (
              <>
                <div className="h-14 w-px bg-slate-100" />
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">예상 혜택</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-green-600">
                      {totalBenefitAmount.toLocaleString()}
                    </span>
                    <span className="text-base font-bold text-slate-400">만원</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Policy breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden"
      >
        <div className="p-8 md:p-10">
          <h3 className="font-black text-slate-900 mb-4">정책별 결과</h3>
          <div className="space-y-3">
            {policyResults.map(({ policy, correctInPolicy, total: pTotal, isEligible }) => (
              <div
                key={policy.policy_id}
                className={`flex items-center justify-between p-4 rounded-2xl ${
                  isEligible ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isEligible ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-black text-sm ${isEligible ? 'text-slate-900' : 'text-slate-500'}`}>
                      {policy.policy_name}
                    </p>
                    {isEligible && policy.max_benefit_amount && (
                      <p className="text-xs text-blue-600 font-bold">
                        최대 {policy.max_benefit_amount.toLocaleString()}만원
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                  correctInPolicy === pTotal
                    ? 'bg-blue-600 text-white'
                    : correctInPolicy > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {correctInPolicy}/{pTotal} 정답
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3"
      >
        {eligiblePolicies.length > 0 && (
          <button
            onClick={onCertificate}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            인증서 받기 · 연간 최대 {totalBenefitAmount.toLocaleString()}만원
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-100"
        >
          <RefreshCcw className="w-4 h-4" />
          처음부터 다시하기
        </button>
      </motion.div>
    </div>
  );
}
