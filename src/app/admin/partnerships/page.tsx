'use client';

import { useState, useEffect } from 'react';
import { getPartnershipInquiries, PartnershipInquiry, updatePartnershipStatus, deletePartnershipInquiry } from '@/lib/services';
import { adminSupabase } from '@/lib/supabaseClient';
import { Search, Calendar, FileText, Trash2, ExternalLink, Filter, X, Check } from 'lucide-react';

export default function PartnershipManagement() {
    const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewing' | 'completed'>('all');

    // Detailed View Modal State
    const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);
    const [tempStatus, setTempStatus] = useState<PartnershipInquiry['status'] | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchInquiries = async () => {
        setLoading(true);
        const data = await getPartnershipInquiries(adminSupabase);
        setInquiries(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const openDetail = (inquiry: PartnershipInquiry) => {
        setSelectedInquiry(inquiry);
        setTempStatus(inquiry.status);
    };

    const closeDetail = () => {
        setSelectedInquiry(null);
        setTempStatus(null);
    };

    const handleConfirmStatus = async () => {
        if (!selectedInquiry || !tempStatus) return;

        // If status remains same, just close
        if (tempStatus === selectedInquiry.status) {
            closeDetail();
            return;
        }

        setIsSaving(true);
        try {
            await updatePartnershipStatus(selectedInquiry.id, tempStatus, adminSupabase);
            setInquiries(inquiries.map(i => i.id === selectedInquiry.id ? { ...i, status: tempStatus } : i));
            closeDetail();
        } catch (err) {
            alert('상태 변경 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent opening detail modal
        if (confirm('이 문의 내역을 정말 삭제하시겠습니까?')) {
            try {
                await deletePartnershipInquiry(id, adminSupabase);
                setInquiries(inquiries.filter(i => i.id !== id));
            } catch (err) {
                alert('삭제 중 오류가 발생했습니다.');
            }
        }
    };

    const filteredInquiries = inquiries.filter(item => {
        const matchesSearch =
            item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">광고 / 제휴 문의 관리</h2>
                    <p className="text-gray-500 mt-2 font-medium">목록을 클릭하여 상세 내용을 확인하고 상태를 변경하세요.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="기업명, 담당자, 이메일 검색..."
                            className="pl-12 pr-6 py-3 border-2 border-gray-100 rounded-2xl text-sm bg-white outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 w-80 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            className="pl-10 pr-10 py-3 border-2 border-gray-100 rounded-2xl text-sm bg-white outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 appearance-none font-bold text-gray-700 pointer-events-auto"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">전체 상태</option>
                            <option value="pending">대기중</option>
                            <option value="reviewing">처리중</option>
                            <option value="completed">처리완료</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">상태</th>
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">기업명</th>
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">담당자</th>
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">이메일</th>
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">연락처</th>
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">접수일</th>
                                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-gray-400 font-medium">데이터를 불러오는 중입니다...</td>
                                </tr>
                            ) : filteredInquiries.length > 0 ? (
                                filteredInquiries.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                                        onClick={() => openDetail(item)}
                                    >
                                        <td className="px-8 py-6">
                                            <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-wider ${item.status === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                                                    item.status === 'reviewing' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                        'bg-green-50 border-green-100 text-green-600'
                                                }`}>
                                                {item.status === 'pending' ? '대기중' : item.status === 'reviewing' ? '처리중' : '처리완료'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{item.companyName}</span>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-700 font-medium">{item.contactPerson}</td>
                                        <td className="px-8 py-6 text-sm text-gray-500 font-medium">{item.email}</td>
                                        <td className="px-8 py-6 text-sm text-gray-500 font-medium">{item.phone}</td>
                                        <td className="px-8 py-6 text-sm text-gray-400 font-medium whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td className="px-8 py-6 text-center">
                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="삭제"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-32 text-center text-gray-400 font-medium">접수된 문의 내역이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal Layer */}
            {selectedInquiry && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">제휴 문의 상세 보기</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">접수번호: {selectedInquiry.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={closeDetail} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-900 shadow-sm border border-transparent hover:border-gray-100">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">기업명</label>
                                    <p className="text-base font-bold text-gray-900">{selectedInquiry.companyName}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">접수일</label>
                                    <p className="text-base font-bold text-gray-900">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">담당자</label>
                                    <p className="text-base font-bold text-gray-900">{selectedInquiry.contactPerson}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">연락처</label>
                                    <p className="text-base font-bold text-gray-900">{selectedInquiry.phone} / {selectedInquiry.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">문의 제목</label>
                                <p className="text-lg font-black text-gray-900 leading-tight">{selectedInquiry.title}</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">문의 내용</label>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-800 text-[1.05rem] leading-8 whitespace-pre-wrap font-medium min-h-[10rem]">
                                    {selectedInquiry.content}
                                </div>
                            </div>

                            {selectedInquiry.fileUrl && (
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">첨부파일</label>
                                    <a
                                        href={selectedInquiry.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl text-primary hover:bg-primary hover:text-white transition-all group/file"
                                    >
                                        <FileText size={20} />
                                        <span className="font-bold">제안서/기획서 보기</span>
                                        <ExternalLink size={16} className="ml-auto opacity-50 group-hover/file:opacity-100 transition-opacity" />
                                    </a>
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">처리 상태 변경</label>
                                <div className="flex gap-2">
                                    {(['pending', 'reviewing', 'completed'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setTempStatus(s)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border-2 ${tempStatus === s
                                                    ? (s === 'pending' ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200' :
                                                        s === 'reviewing' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' :
                                                            'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200')
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {s === 'pending' ? '대기중' : s === 'reviewing' ? '처리중' : '처리완료'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={handleConfirmStatus}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-base hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {isSaving ? '저장 중...' : (
                                    <>
                                        <Check size={20} className="group-hover:scale-110 transition-transform" />
                                        확인
                                    </>
                                )}
                            </button>
                            <button
                                onClick={closeDetail}
                                className="px-10 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black text-base hover:bg-gray-50 transition-all"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
