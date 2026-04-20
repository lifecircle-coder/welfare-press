'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RefreshCcw, Sparkles, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SituationData } from './SituationInput';

// ── Types ──────────────────────────────────────────────────────────────────

interface QuizOption {
  label: string;
  value: string;
}

interface WelfareQuiz {
  id: string;
  policy_id: string;
  policy_name: string;
  policy_category: string;
  max_benefit_amount: number | null;
  benefit_description: string | null;
  question_order: number;
  question: string;
  question_type: 'ox' | 'multiple';
  options: QuizOption[];
  correct_answer: string;
  explanation: string | null;
  target_age_min: number | null;
  target_age_max: number | null;
  target_income_levels: string[] | null;
  target_household_types: string[] | null;
  target_regions: string[] | null;
  sort_order: number;
}

interface Answer {
  quiz_id: string;
  policy_id: string;
  selected: string;
  is_correct: boolean;
}

export interface QuizResult {
  answers: Answer[];
  questions: WelfareQuiz[];
  situation: SituationData;
  totalBenefitAmount: number;
  eligiblePolicies: {
    policy_id: string;
    policy_name: string;
    max_benefit_amount: number | null;
    benefit_description: string | null;
  }[];
}

// ── Household & Income Mappings ────────────────────────────────────────────

const HOUSEHOLD_MAP: Record<SituationData['householdType'], string> = {
  single: '1인가구',
  couple: '2인가구',
  family: '3인이상',
};

const INCOME_ELIGIBLE_LEVELS: Record<SituationData['incomeLevel'], string[]> = {
  low: ['중위50%이하', '중위60%이하', '중위70%이하', '중위100%이하'],
  medium: ['중위100%이하'],
  high: [],
};

// ── Filtering ──────────────────────────────────────────────────────────────

function filterQuestions(questions: WelfareQuiz[], situation: SituationData): WelfareQuiz[] {
  const dbHousehold = HOUSEHOLD_MAP[situation.householdType];

  return questions.filter((q) => {
    // Age filter (strict)
    if (q.target_age_min !== null && situation.age < q.target_age_min) return false;
    if (q.target_age_max !== null && situation.age > q.target_age_max) return false;

    // Household type filter (strict when DB specifies)
    if (q.target_household_types !== null && !q.target_household_types.includes(dbHousehold)) {
      return false;
    }

    return true;
  });
}

function calcEligiblePolicies(questions: WelfareQuiz[], answers: Answer[], situation: SituationData) {
  const eligibleLevels = INCOME_ELIGIBLE_LEVELS[situation.incomeLevel];

  const policyIds = [...new Set(questions.map((q) => q.policy_id))];

  return policyIds
    .map((pid) => {
      const policyQuestions = questions.filter((q) => q.policy_id === pid);
      const policy = policyQuestions[0];

      // Income eligibility
      const incomeOk =
        policy.target_income_levels === null ||
        policy.target_income_levels.some((l) => eligibleLevels.includes(l));
      if (!incomeOk) return null;

      // Both questions must be answered correctly
      const policyAnswers = answers.filter((a) => a.policy_id === pid);
      const allCorrect = policyAnswers.length === policyQuestions.length &&
        policyAnswers.every((a) => a.is_correct);
      if (!allCorrect) return null;

      return {
        policy_id: pid,
        policy_name: policy.policy_name,
        max_benefit_amount: policy.max_benefit_amount,
        benefit_description: policy.benefit_description,
      };
    })
    .filter(Boolean) as QuizResult['eligiblePolicies'];
}

// ── Category Colors ────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  청년: 'bg-blue-100 text-blue-700',
  아동: 'bg-green-100 text-green-700',
  노인: 'bg-orange-100 text-orange-700',
  장애인: 'bg-purple-100 text-purple-700',
  가족: 'bg-pink-100 text-pink-700',
  기타: 'bg-slate-100 text-slate-600',
};

// ── Main Component ─────────────────────────────────────────────────────────

interface Props {
  situation: SituationData;
  onComplete: (result: QuizResult) => void;
  onReset: () => void;
}

export default function QuizFlow({ situation, onComplete, onReset }: Props) {
  const [questions, setQuestions] = useState<WelfareQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('welfare_quizzes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        setError('퀴즈를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      const filtered = filterQuestions(data as WelfareQuiz[], situation);
      setQuestions(filtered);
      setLoading(false);
    }

    fetchQuestions();
  }, [situation]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const correctCount = answers.filter((a) => a.is_correct).length;

  function handleSelect(value: string) {
    if (answered) return;
    const isCorrect = value === currentQuestion.correct_answer;
    setSelected(value);
    setAnswered(true);
    setAnswers((prev) => [
      ...prev,
      {
        quiz_id: currentQuestion.id,
        policy_id: currentQuestion.policy_id,
        selected: value,
        is_correct: isCorrect,
      },
    ]);
  }

  function handleNext() {
    if (currentIndex + 1 >= totalQuestions) {
      const finalAnswers = answers;
      const eligible = calcEligiblePolicies(questions, finalAnswers, situation);
      const total = eligible.reduce((sum, p) => sum + (p.max_benefit_amount ?? 0), 0);
      setCompleted(true);
      onComplete({
        answers: finalAnswers,
        questions,
        situation,
        totalBenefitAmount: total,
        eligiblePolicies: eligible,
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">
          {situation.district} 맞춤 퀴즈를 불러오는 중...
        </p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 text-center">
        <p className="text-slate-500 font-bold mb-6">
          {error ?? '해당 조건에 맞는 퀴즈가 없습니다.'}
        </p>
        <button
          onClick={onReset}
          className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all"
        >
          상황 다시 입력하기
        </button>
      </div>
    );
  }

  // ── Completed State ──────────────────────────────────────────────────────

  if (completed) return null;

  // ── Quiz Question ────────────────────────────────────────────────────────

  const isOX = currentQuestion.question_type === 'ox';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {totalQuestions} 문제
          </span>
          <span className="text-xs font-bold text-blue-600">
            현재 정답 {correctCount}개
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            animate={{ width: `${((currentIndex + (answered ? 1 : 0)) / totalQuestions) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5 overflow-hidden"
        >
          <div className="p-8 md:p-12 space-y-8">
            {/* Policy badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                복지 퀴즈
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${CATEGORY_STYLE[currentQuestion.policy_category] ?? 'bg-slate-100 text-slate-600'}`}>
                {currentQuestion.policy_category}
              </span>
              <span className="text-xs font-bold text-slate-500">{currentQuestion.policy_name}</span>
              {currentQuestion.max_benefit_amount !== null && (
                <span className="text-xs font-black text-blue-600 ml-auto">
                  최대 {currentQuestion.max_benefit_amount.toLocaleString()}만원
                </span>
              )}
            </div>

            {/* Question */}
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            {isOX ? (
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selected === opt.value;
                  const isCorrect = opt.value === currentQuestion.correct_answer;
                  let style = 'border-slate-100 hover:border-slate-200 text-slate-700';
                  if (answered) {
                    if (isCorrect) style = 'border-green-500 bg-green-50 text-green-700';
                    else if (isSelected) style = 'border-red-400 bg-red-50 text-red-600';
                    else style = 'border-slate-100 opacity-40';
                  } else if (isSelected) {
                    style = 'border-blue-600 bg-blue-50 text-blue-700';
                  }

                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      disabled={answered}
                      className={`py-10 rounded-[2rem] border-2 font-black text-2xl transition-all flex flex-col items-center gap-3 ${style}`}
                    >
                      <span className="text-4xl">{opt.value === 'yes' ? '⭕' : '✗'}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selected === opt.value;
                  const isCorrect = opt.value === currentQuestion.correct_answer;
                  let style = 'border-slate-100 hover:border-slate-200';
                  let icon = null;
                  if (answered) {
                    if (isCorrect) {
                      style = 'border-green-500 bg-green-50';
                      icon = <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
                    } else if (isSelected) {
                      style = 'border-red-400 bg-red-50';
                      icon = <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
                    } else {
                      style = 'border-slate-100 opacity-40';
                    }
                  } else if (isSelected) {
                    style = 'border-blue-600 bg-blue-50';
                  }

                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      disabled={answered}
                      className={`w-full p-5 rounded-[1.5rem] border-2 text-left transition-all flex items-center gap-3 ${style}`}
                    >
                      {icon}
                      <span className={`font-bold ${answered && isCorrect ? 'text-green-700' : answered && isSelected ? 'text-red-600' : 'text-slate-900'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation (after answer) */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border-l-4 ${
                    selected === currentQuestion.correct_answer
                      ? 'bg-green-50 border-green-500'
                      : 'bg-amber-50 border-amber-400'
                  }`}
                >
                  <p className={`text-xs font-black mb-2 ${
                    selected === currentQuestion.correct_answer ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {selected === currentQuestion.correct_answer ? '✅ 정답입니다!' : '❌ 오답입니다'}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next button */}
            {answered && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
              >
                {currentIndex + 1 >= totalQuestions ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    결과 확인하기
                  </>
                ) : (
                  <>
                    다음 문제
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reset link */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 mx-auto"
        >
          <RefreshCcw className="w-3 h-3" /> 상황 다시 입력
        </button>
      </div>
    </div>
  );
}
