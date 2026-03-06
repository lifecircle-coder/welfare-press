'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '@/lib/supabaseClient';
import { Lock, User, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!loginId || !password) {
            setError('아이디와 비밀번호를 모두 입력해 주세요.');
            setIsLoading(false);
            return;
        }

        try {
            // Internal Mapping: ID -> Email (Supabase Auth 요구사항 충족)
            const email = loginId.includes('@') ? loginId : `${loginId}@welfare-press.admin`;

            const { data, error: authError } = await adminSupabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('아이디 또는 비밀번호가 일치하지 않습니다.');
                } else {
                    setError(authError.message);
                }
                setIsLoading(false);
                return;
            }

            if (data.session) {
                // 로그인 성공 후 역할에 따라 이동
                const role = data.session.user.user_metadata?.role;
                if (role === 'reporter') {
                    router.push('/admin/articles');
                } else {
                    router.push('/admin');
                }
            }
        } catch (err: any) {
            setError('로그인 중 예상치 못한 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-blue-500/20">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">관리자 시스템</h1>
                    <p className="text-slate-400 mt-2 font-medium">서비스 운영 및 컨텐츠 관리를 위해 로그인하세요.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-200">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">아이디</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 font-medium"
                                    placeholder="ID를 입력하세요"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">비밀번호</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary hover:bg-blue-600 text-white rounded-2xl font-extrabold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '인증 처리 중...' : '관리자 로그인'}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <div className="text-slate-400 text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="w-8 h-px bg-slate-100"></span>
                            Security Guard Active
                            <span className="w-8 h-px bg-slate-100"></span>
                        </div>
                        <p className="mt-4 text-[10px] text-slate-400">
                            이 시스템은 승인된 사용자만 이용할 수 있습니다.<br />
                            비정상적인 접근 시도가 기록됩니다.
                        </p>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-slate-500 hover:text-white text-sm font-bold transition-colors underline underline-offset-4"
                    >
                        홈페이지로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
