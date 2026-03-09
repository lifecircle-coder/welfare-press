'use client';

import { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { addPartnershipInquiry } from '@/lib/services';

interface PartnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [agreed, setAgreed] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        title: '',
        content: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert('파일 크기는 최대 5MB까지 가능합니다.');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            alert('개인정보보호를 위한 이용자 동의사항에 동의해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await addPartnershipInquiry(formData, file || undefined);
            setStep('success');
        } catch (error) {
            alert('문의 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">광고/제휴 문의</h3>
                        <p className="text-sm text-gray-500 mt-1">성공적인 비즈니스 파트너십을 제안해 주세요.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'form' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Privacy Agreement */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-2">개인정보보호를 위한 이용자 동의사항</h4>
                                <div className="text-xs text-gray-600 space-y-2 leading-relaxed h-24 overflow-y-auto pr-2 custom-scrollbar">
                                    <p>&apos;[THE 복]&apos;은 광고/제휴 등의 문의를 희망하는 기업 및 개인을 대상으로 아래와 같이 개인정보를 수집하고 있습니다.</p>
                                    <p>1. 수집 개인정보 항목 : 회사명, 이름, 이메일, 전화번호</p>
                                    <p>2. 개인정보의 수집 및 이용목적 : 신청에 따른 본인확인 및 원활한 의사소통 경로 확보</p>
                                    <p>3. 개인정보의 이용기간 : 모든 검토가 완료된 후 3개월간 이용자의 조회를 위하여 보관하며, 이후 해당정보를 지체 없이 파기합니다.</p>
                                    <p>4. 그 밖의 사항은 개인정보취급방침을 준수합니다.</p>
                                </div>
                                <label className="mt-3 flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                                        개인정보보호를 위한 이용자 동의사항을 확인하였습니다.
                                    </span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">회사명</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                        placeholder="회사명을 입력해주세요"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">담당자</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                        placeholder="담당자 성함을 입력해주세요"
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">이메일</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">휴대전화번호</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                        placeholder="010-0000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">제목</label>
                                <input
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                    placeholder="광고/제휴 문의 제목을 입력해주세요"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">내용</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 resize-none"
                                    placeholder="광고/제휴 문의 내용을 상세히 작성해주세요"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                ></textarea>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">파일 첨부 (최대 5MB)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-primary cursor-pointer transition-all group"
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
                                    />
                                    <Upload size={24} className="mx-auto text-gray-400 group-hover:text-primary mb-2" />
                                    <p className="text-sm font-medium text-gray-600">
                                        {file ? file.name : '제안서 등 관련 파일을 선택해주세요.'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, JPG, PNG 지원</p>
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>제출 중...</span>
                                    </>
                                ) : '광고/제휴 문의 등록하기'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={48} className="text-green-500" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2">광고/제휴 문의가 접수되었습니다</h4>
                            <p className="text-gray-500 leading-relaxed mb-8">
                                보내주신 광고/제휴 제안은 담당자 검토 후<br />
                                기재하신 연락처로 회신 드리겠습니다.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    setTimeout(() => {
                                        setStep('form');
                                        setFormData({ companyName: '', contactPerson: '', email: '', phone: '', title: '', content: '' });
                                        setFile(null);
                                        setAgreed(false);
                                    }, 200);
                                }}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md"
                            >
                                확인
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
