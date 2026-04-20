'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SituationInput, { SituationData } from '@/components/welfare/SituationInput';
import QuizFlow, { QuizResult } from '@/components/welfare/QuizFlow';
import QuizResultScreen from '@/components/welfare/QuizResult';
import Certificate from '@/components/welfare/Certificate';

type FlowState = 'input' | 'quiz' | 'result' | 'certificate';

export default function WelfareQuizFlow() {
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [situation, setSituation] = useState<SituationData | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleSituationSubmit = (data: SituationData) => {
    setSituation(data);
    setResult(null);
    setFlowState('quiz');
  };

  const handleQuizComplete = (quizResult: QuizResult) => {
    setResult(quizResult);
    setFlowState('result');
  };

  const handleRestart = () => {
    setSituation(null);
    setResult(null);
    setFlowState('input');
  };

  return (
    <AnimatePresence mode="wait">
      {flowState === 'input' && (
        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <SituationInput onSubmit={handleSituationSubmit} />
        </motion.div>
      )}

      {flowState === 'quiz' && situation && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizFlow
            situation={situation}
            onComplete={handleQuizComplete}
            onReset={handleRestart}
          />
        </motion.div>
      )}

      {flowState === 'result' && result && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizResultScreen
            result={result}
            onRestart={handleRestart}
            onCertificate={() => setFlowState('certificate')}
          />
        </motion.div>
      )}

      {flowState === 'certificate' && result && (
        <motion.div
          key="certificate"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          <Certificate result={result} />
          <div className="text-center space-y-3">
            <button
              onClick={() => setFlowState('result')}
              className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              ← 결과로 돌아가기
            </button>
            <div className="block">
              <button
                onClick={handleRestart}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                처음부터 다시하기
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
