'use client';

import { Search, CheckCircle, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getInquiries, updateInquiry } from '@/lib/services';
import type { Inquiry } from '@/lib/services';
import { adminSupabase } from '@/lib/supabaseClient';

export default function InquiryManagement() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, answered
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [answerText, setAnswerText] = useState('');

    useEffect(() => {
        const fetchInquiries = async () => {
            const data = await getInquiries();
            setInquiries(data);
        };
        fetchInquiries();
    }, []);

    const filteredInquiries = inquiries.filter(i => {
        if (filterStatus === 'all') return true;
        return i.status === filterStatus;
    });

    const handleOpenAnswer = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setAnswerText(inquiry.answer || '');
    };

    const handleSaveAnswer = async () => {
        if (!selectedInquiry) return;

        const updated: Inquiry = {
            ...selectedInquiry,
            status: 'answered',
            answer: answerText
        };

        await updateInquiry(updated.id, answerText); // Fix: updateInquiry(id, answer) signature
        const data = await getInquiries();
        setInquiries(data); // Refresh list
        setSelectedInquiry(null);
        alert('답변이 등록되었습니다.');
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">1:1 문의 관리</h2>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-primary transition-all">
                    <Search size={18} className="text-gray-400" />
                    <input type="text" placeholder="제목 또는 작성자 검색" className="outline-none text-sm w-full" />
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        전체
                    </button>
                    <button
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterStatus === 'pending' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        대기중
                    </button>
                    <button
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterStatus === 'answered' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setFilterStatus('answered')}
                    >
                        답변완료
                    </button>
                </div>
            </div>

            {/* Inquiry List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium w-12"><input type="checkbox" /></th>
                            <th className="p-4 font-medium">상태</th>
                            <th className="p-4 font-medium">제목</th>
                            <th className="p-4 font-medium">작성자</th>
                            <th className="p-4 font-medium">등록일</th>
                            <th className="p-4 font-medium">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredInquiries.length > 0 ? (
                            filteredInquiries.map((inquiry) => (
                                <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4"><input type="checkbox" /></td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 w-20 
                                            ${inquiry.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {inquiry.status === 'answered' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {inquiry.status === 'answered' ? '완료' : '대기'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 mb-1">{inquiry.title}</div>
                                        <div className="text-sm text-gray-500 line-clamp-1">{inquiry.content}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{inquiry.author}</td>
                                    <td className="p-4 text-gray-400 text-sm">{inquiry.date}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleOpenAnswer(inquiry)}
                                            className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-sm font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                                        >
                                            {inquiry.status === 'answered' ? '수정' : '답변'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">문의 내역이 없습니다. (현재 필터 기준)</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Answer Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up m-4">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">문의 답변 작성</h3>
                            <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">문의 제목</div>
                                <div className="font-bold text-gray-900 mb-2">{selectedInquiry.title}</div>
                                <div className="text-xs font-bold text-gray-500 mb-1">문의 내용</div>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                    {selectedInquiry.content}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">답변 내용</label>
                                <textarea
                                    className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none resize-none"
                                    placeholder="고객님께 전달할 답변을 입력하세요."
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                            <button
                                onClick={() => setSelectedInquiry(null)}
                                className="px-5 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveAnswer}
                                className="px-5 py-2.5 rounded-lg font-bold bg-primary text-white hover:bg-blue-600 shadow-md"
                            >
                                답변 등록
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
