'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
        try {
            setIsLoading(true);
            const redirectTo = `${window.location.origin}/auth/callback`;
            console.log('Attempting OAuth login with redirect:', redirectTo);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    queryParams: {
                        prompt: 'select_account',
                    },
                    redirectTo: redirectTo,
                },
            });
            if (error) {
                console.error('Login error:', error.message);
                alert('로그인 중 오류가 발생했습니다.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">

                {/* Close Button (Optional, redirects to home if clicked) */}
                <Link href="/" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                </Link>

                <div className="p-8 text-center">
                    {/* Logo area */}
                    <div className="mb-6">
                        <span className="text-3xl font-bold text-primary tracking-tight">복지뉴스</span>
                        <p className="text-gray-500 mt-2 font-medium">전국민을 위한 맞춤형 복지 정보</p>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-8">
                        로그인
                    </h2>

                    {/* Google Login Button */}
                    <button
                        onClick={() => handleOAuthLogin('google')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 text-gray-700 font-bold transition-all transform hover:-translate-y-0.5"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {isLoading ? '로그인 처리 중...' : '구글 계정으로 로그인'}
                    </button>

                    <p className="mt-8 text-xs text-gray-500">
                        로그인 시 <Link href="/policy/terms" className="underline hover:text-gray-800">이용약관</Link> 및 <Link href="/policy/privacy" className="underline hover:text-gray-800">개인정보처리방침</Link>에 동의하게 됩니다.
                    </p>
                </div>
            </div>

            {/* Backdrop Blur Effect */}
            <div className="absolute inset-0 -z-10 backdrop-blur-sm"></div>
        </div>
    );
}
