'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
    onSuccess: () => void;
}

export default function ForcePasswordChangeModal({ onSuccess }: Props) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            // 2. Clear the flag in metadata
            const { error: metaError } = await supabase.auth.updateUser({
                data: { needs_password_change: false }
            });

            if (metaError) throw metaError;

            alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인 해주세요.');
            await supabase.auth.signOut();
            window.location.reload();
            onSuccess();
        } catch (err: any) {
            setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-primary p-6 text-white flex flex-col items-center gap-2">
                    <div className="bg-white/20 p-3 rounded-full">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-xl font-bold">비밀번호 변경 안내</h2>
                    <p className="text-sm text-blue-100 text-center">
                        보안을 위해 임시 비밀번호를 변경해 주세요.<br />
                        새로운 비밀번호를 입력하면 정상적으로 이용 가능합니다.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="p-8 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex gap-2 items-center border border-red-100">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block ml-1">새 비밀번호</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            placeholder="6자 이상의 비밀번호"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block ml-1">비밀번호 확인</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                비밀번호 변경 완료
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        변경 완료 후에는 자동으로 로그아웃됩니다.<br />
                        새로운 비밀번호로 다시 로그인해 주세요.
                    </p>
                </form>
            </div>
        </div>
    );
}
