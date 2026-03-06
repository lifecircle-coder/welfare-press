'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createInquiry } from '@/lib/services';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function InquiryModal({ isOpen, onClose }: Props) {
    const [type, setType] = useState('일반 문의');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check for user in localStorage
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;

            // Allow submission even if not logged in (or use dummy data if needed as per user request context)
            const authorName = user ? user.name : '익명';
            const authorEmail = user ? user.email : 'anonymous@example.com';

            await createInquiry({
                title: `[${type}] ${title}`,
                content,
                author: authorName,
                email: authorEmail,
                status: 'pending'
            });

            alert('문의가 접수되었습니다.');
            onClose();
            // Reset form
            setTitle('');
            setContent('');
            setType('일반 문의');
        } catch (error) {
            console.error('Inquiry failed:', error);
            alert('문의 접수에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">1:1 문의하기</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Type Dropdown */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">문의 유형</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                            <option>일반 문의</option>
                            <option>제보</option>
                            <option>기사 정정 요청</option>
                            <option>광고 문의</option>
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">문의 내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="문의하실 내용을 자세히 적어주세요."
                            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                처리중...
                            </>
                        ) : (
                            '문의하기'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
