'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getComments, getInquiries, getArticleById } from '@/lib/services';
import type { Comment, Inquiry, Article } from '@/lib/services';
import { supabase } from '@/lib/supabaseClient';

export default function MyPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'comments' | 'inquiries'>('comments');
    const [myComments, setMyComments] = useState<{ comment: Comment; articleTitle: string }[]>([]);
    const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
    const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);

    useEffect(() => {
        const loadUserData = async () => {
            // 1. Check Login Status via localStorage (still used for session)
            const storedUser = localStorage.getItem('user');
            if (!storedUser || storedUser === 'undefined') {
                alert('로그인이 필요한 서비스입니다.');
                router.push('/login');
                return;
            }
            const sessionUser = JSON.parse(storedUser);

            // Fetch fresh user data from DB
            const dbUser = await import('@/lib/services').then(s => s.getUserById(sessionUser.id));
            if (dbUser) {
                setUser(dbUser);
            } else {
                setUser(sessionUser); // Fallback
            }

            // 2. Load User's Comments (Need a way to fetch by author)
            // Currently services.ts doesn't support "get comments by author".
            // We'll add this capability or fetching logic.
            // For now, let's fetch all articles and filter... wait that's bad.
            // Let's implement a new service function: getCommentsByAuthor
            // We will add it to services.ts.
            const userComments = await import('@/lib/services').then(s => s.getCommentsByAuthor(sessionUser.name));

            // Enrich with article titles (N+1 problem but okay for small scale)
            // We can optimize this by fetching all articles once if needed.
            const commentsWithTitles = await Promise.all(userComments.map(async (c) => {
                const article = await getArticleById(c.articleId);
                return {
                    comment: c,
                    articleTitle: article ? article.title : '삭제된 기사입니다.'
                };
            }));
            setMyComments(commentsWithTitles.reverse());

            // 3. Load User's Inquiries
            const allInquiries = await getInquiries();
            const userInquiries = allInquiries.filter(i => i.author === sessionUser.name);
            setMyInquiries(userInquiries);
        };
        loadUserData();
    }, [router]);

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('storage-update-user'));
            router.push('/');
        }
    };

    const toggleInquiry = (id: string) => {
        setExpandedInquiryId(expandedInquiryId === id ? null : id);
    };

    if (!user) return <div className="min-h-screen flex justify-center items-center">로딩 중...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
            {/* Header / Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {user.name}님
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {user.grade || '일반회원'}
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {user.email || '이메일 정보 없음'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                    <LogOut size={16} />
                    로그아웃
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'comments'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare size={18} />
                    나의 활동 (댓글)
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {myComments.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'inquiries'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <HelpCircle size={18} />
                    1:1 문의 내역
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {myInquiries.length}
                    </span>
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                    <div className="p-6">
                        {myComments.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {myComments.map(({ comment, articleTitle }) => (
                                    <li key={comment.id} className="py-6 first:pt-0 last:pb-0">
                                        <Link href={`/article/${comment.articleId}#comments`} className="group block">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-primary font-medium group-hover:underline">
                                                    TO: {articleTitle}
                                                </span>
                                                <span className="text-xs text-gray-400">{comment.date}</span>
                                            </div>
                                            <p className="text-gray-700 group-hover:text-gray-900 transition-colors line-clamp-2">
                                                {comment.parentId && <span className="text-primary font-bold mr-1">[답글]</span>}
                                                {comment.content}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p>작성한 댓글이 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Inquiries Tab */}
                {activeTab === 'inquiries' && (
                    <div className="p-6">
                        {myInquiries.length > 0 ? (
                            <ul className="space-y-4">
                                {myInquiries.map((inquiry) => (
                                    <li key={inquiry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleInquiry(inquiry.id)}
                                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${inquiry.status === 'answered'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                                                </span>
                                                <span className="font-medium text-gray-900 truncate">
                                                    {inquiry.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <span className="text-xs text-gray-400">{inquiry.date}</span>
                                                {expandedInquiryId === inquiry.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                            </div>
                                        </button>

                                        {/* Expanded Content */}
                                        {expandedInquiryId === inquiry.id && (
                                            <div className="bg-gray-50 border-t border-gray-100 p-6 space-y-6">
                                                {/* Question */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                                                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">Q</span>
                                                        문의 내용
                                                    </div>
                                                    <p className="text-gray-700 pl-8 whitespace-pre-wrap">{inquiry.content}</p>
                                                </div>

                                                {/* Answer */}
                                                {inquiry.answer && (
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <div className="flex items-center gap-2 mb-2 text-green-600 font-bold text-sm">
                                                            <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">A</span>
                                                            관리자 답변
                                                        </div>
                                                        <p className="text-gray-700 pl-8 whitespace-pre-wrap">{inquiry.answer}</p>
                                                    </div>
                                                )}

                                                {/* No Answer Yet Message */}
                                                {!inquiry.answer && (
                                                    <p className="pl-8 text-sm text-gray-500 flex items-center gap-2">
                                                        <HelpCircle size={14} />
                                                        빠른 시일 내에 답변 드리겠습니다.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                                <HelpCircle size={48} className="mb-4 opacity-20" />
                                <p>작성한 문의 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
