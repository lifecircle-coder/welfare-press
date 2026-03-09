'use client';

import Link from 'next/link';
import { MessageCircle, Headphones } from 'lucide-react';
import { useState } from 'react';
import InquiryModal from '@/components/inquiry/InquiryModal';
import PartnershipModal from '@/components/layout/PartnershipModal';

export default function Footer() {
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);

    return (
        <>
            <footer className="bg-white border-t border-gray-200 mt-20 pt-16 pb-12">
                {/* 
                   User Request: 
                   1. Mobile: Consult Section (Right) should be ABOVE Company Info (Left).
                   2. Desktop: Info (Left), Consult (Right).
                   Solution: flex-col-reverse md:flex-row
                   3. Alignment: Center for both.
                */}
                <div className="container mx-auto px-4 flex flex-col-reverse md:flex-row justify-center items-center gap-12 md:gap-32">

                    {/* Left: Info */}
                    <div className="flex-1 space-y-4 text-center md:text-left w-full">
                        <Link href="/" className="text-2xl font-bold text-gray-400 tracking-tight block hover:text-primary transition-colors">
                            THE 복(福)
                        </Link>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            전국민을 위한 복지 전문 뉴스,<br />
                            정확하고 빠른 정보를 전달합니다.
                        </p>

                        <div className="text-sm text-gray-400 space-y-1.5 pt-4">
                            <p>제호 : The 복 | 등록번호 : 서울 - 아00000 | 등록일 : 2026년 03월 00일 | 발행일 : 2026년 03월 00일 |</p>
                            <p>발행인·편집인 : 변·창·환  |  청소년보호책임자 : 변·창·환 | 기사제보·광고·제휴문의 : 02-6396-2114 | eosr0509@gmail.com |</p>
                            <p>주소 : 서울특별시 영등포구 신길동 4958-1. 109-703 | 02-6396-2114 | eosr0509@gmail.com |</p>
                            <div className="pt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                                <Link href="/policy/terms" className="cursor-pointer hover:underline hover:text-gray-600">이용약관</Link>
                                <span className="text-gray-300">|</span>
                                <Link href="/policy/privacy" className="cursor-pointer hover:underline font-bold text-gray-600">개인정보처리방침</Link>
                                <span className="text-gray-300">|</span>
                                <Link href="/policy/youth" className="cursor-pointer hover:underline hover:text-gray-600">청소년보호정책</Link>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setIsPartnershipOpen(true)} className="cursor-pointer hover:underline hover:text-gray-600 outline-none">광고/제휴문의</button>
                            </div>
                            <p className="pt-2 text-xs opacity-75">Copyright ©2026 The Bok. All rights reserved.</p>
                        </div>
                    </div>

                    {/* Right: 1:1 Inquiry with Illustration Integration */}
                    {/* User Request: Center Align, Mobile Top */}
                    <div className="flex flex-col items-center w-full md:w-auto mt-0 md:mt-0 mb-8 md:mb-0">
                        {/* Consultant Illustration Area */}
                        <div className="mb-4 relative group cursor-pointer" onClick={() => setIsInquiryOpen(true)}>
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm group-hover:bg-blue-100 transition-colors">
                                <Headphones size={40} className="text-primary" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                상담 가능
                            </div>
                        </div>

                        <button
                            onClick={() => setIsInquiryOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <span className="text-left leading-tight">
                                <MessageCircle size={20} />
                                <span className="block text-lg">1:1 문의하기</span>
                                <span className="block text-[11px] font-normal opacity-70">(제보/광고/제휴/기타)</span>
                            </span>
                        </button>
                        <p className="text-sm text-gray-400 mt-3 text-center">
                            평일 09:30 ~ 17:30<br />
                            <span className="text-xs opacity-75">(토,일요일/공휴일 휴무)</span>
                        </p>
                    </div>

                </div>
            </footer>

            {/* Modal */}
            <InquiryModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} />
            <PartnershipModal isOpen={isPartnershipOpen} onClose={() => setIsPartnershipOpen(false)} />
        </>
    );
}
