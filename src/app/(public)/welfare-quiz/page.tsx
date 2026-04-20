import { Metadata } from 'next';
import WelfareQuizFlow from './WelfareQuizFlow';

export const metadata: Metadata = {
  title: '복지 퀴즈 | THE복지',
  description: '내 지역·나이·소득에 맞는 복지 혜택을 퀴즈로 확인하고 인증서를 받아보세요.',
  openGraph: {
    title: '복지 퀴즈 — 내 혜택을 직접 확인하세요',
    description: '상황 입력 → 퀴즈 → 인증서 발급. 연간 최대 수백만 원의 혜택을 놓치지 마세요.',
  },
};

export default function WelfareQuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">
            THE복지 × 복지 퀴즈
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            내 지역 복지 혜택,<br />
            <span className="text-blue-600">퀴즈로 확인하세요</span>
          </h1>
          <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
            3분이면 충분해요. 내 상황을 입력하고 퀴즈를 풀면<br className="hidden sm:block" />
            연간 수백만 원의 혜택 인증서를 받을 수 있어요.
          </p>
        </div>

        <WelfareQuizFlow />
      </div>
    </div>
  );
}
