'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { saveArticle, getUsers, getArticleById } from '@/lib/services';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { adminSupabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ClientQuillEditor = dynamic(() => import('@/components/admin/ClientQuillEditor'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">에디터 로딩 중...</div>
});

function WriteArticleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

    const [reporters, setReporters] = useState<{ id: string, name: string, role: string }[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch current user role
            const { data: { session } } = await adminSupabase.auth.getSession();
            if (session?.user) {
                setUserRole(session.user.user_metadata?.role || 'reporter');
            }

            const users = await getUsers(adminSupabase);
            const filteredReporters = users.filter(u => u.role === 'reporter' || u.role === 'admin');
            setReporters(filteredReporters);

            if (!editId && filteredReporters.length > 0) {
                setFormData(prev => ({ ...prev, author: filteredReporters[0].name }));
            }
        };
        fetchInitialData();
    }, [editId]);

    const [formData, setFormData] = useState({
        id: '',
        title: '',
        summary: '',
        content: '',
        category: '일자리·취업',
        prefix: '일자리', // 말머리
        author: '관리자', // Default fallback
        hashtags: '',
        status: 'published' as 'published' | 'draft',
        date: '',
        updated_at: ''
    });
    // Load existing data if editing
    useEffect(() => {
        if (editId) {
            getArticleById(editId, adminSupabase).then(article => {
                if (article) {
                    try {
                        setFormData({
                            id: article.id,
                            title: article.title || '',
                            summary: article.summary || '',
                            content: article.content || '',
                            category: article.category || '일자리·취업',
                            prefix: article.prefix || '일반', // Fixed: Load saved prefix
                            author: article.author || '관리자',
                            hashtags: Array.isArray(article.hashtags)
                                ? article.hashtags.join(', ')
                                : (typeof article.hashtags === 'string' ? article.hashtags : ''),
                            status: (article.status as 'published' | 'draft') || 'published',
                            date: article.date || '',
                            updated_at: article.updated_at || ''
                        });
                    } catch (e) {
                        console.error('Error loading article data:', e);
                    }
                }
            });
        }
    }, [editId]);

    const PREFIX_OPTIONS: Record<string, string[]> = {
        '일자리·취업': ['일자리', '취업', '창업', '교육'],
        '주거·금융': ['주거', '금융', '청약', '대출'],
        '건강·의료': ['건강', '의료', '보험', '운동'],
        '생활·안전': ['생활', '안전', '교통', '환경'],
        '임신·육아': ['임신', '육아', '보육', '지원']
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cat = e.target.value;
        setFormData(prev => ({
            ...prev,
            category: cat,
            prefix: PREFIX_OPTIONS[cat]?.[0] || '일반'
        }));
    };
    const handleSave = async () => {
        if (!formData.title || !formData.content) return alert('제목과 본문을 입력해주세요.');

        // Use crypto.randomUUID() for new articles to match Supabase UUID type
        const newArticle: any = {
            id: formData.id || crypto.randomUUID(),
            title: formData.title,
            category: formData.category,
            prefix: formData.prefix,
            author: formData.author,
            created_at: formData.id ? undefined : (formData.date || undefined), // 수정 시에는 명시적 전달 안 함 (DB 유지)
            views: 0,
            status: formData.status,
            summary: formData.summary,
            content: formData.content,
            hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean)
        };

        const result = await saveArticle(newArticle, adminSupabase);

        if (result.success) {
            alert(editId ? '기사가 수정되었습니다.' : '기사가 등록되었습니다.');
            router.push('/admin/articles');
        } else {
            alert(`기사 저장에 실패했습니다.\n\n오류 내용: ${result.error?.message || JSON.stringify(result.error)}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/articles" className="text-gray-500 hover:text-gray-900">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-2xl font-bold text-gray-900">
                    {editId ? '기사 수정' : '기사 작성'}
                </h2>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">기사 제목</label>
                    <input
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none font-bold text-lg"
                        placeholder="제목을 입력하세요"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                </div>

                {/* Summary */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">요약본 (썸네일/리스트 노출)</label>
                    <textarea
                        className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none resize-none"
                        placeholder="기사 요약 내용을 입력하세요..."
                        value={formData.summary}
                        onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    ></textarea>
                </div>

                {/* Category & Prefix */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">카테고리 (대분류)</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none"
                            value={formData.category}
                            onChange={handleCategoryChange}
                        >
                            {Object.keys(PREFIX_OPTIONS).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">말머리 (소분류 Display)</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none"
                            value={formData.prefix}
                            onChange={e => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                        >
                            {PREFIX_OPTIONS[formData.category]?.map(p => (
                                <option key={p} value={p}>{p}</option>
                            )) || <option value="일반">일반</option>}
                        </select>
                    </div>
                </div>

                <div className="h-[500px] mb-12">
                    <label className="block text-sm font-bold text-gray-700 mb-2">본문 (상세 내용)</label>
                    <ClientQuillEditor
                        value={formData.content}
                        onChange={(value: string) => setFormData(prev => ({ ...prev, content: value }))}
                        articleId={formData.id}
                    />
                </div>

                {/* Author & Hashtags */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">작성자 (기자)</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none"
                            value={formData.author}
                            onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        >
                            {reporters.map(r => (
                                <option key={r.id} value={r.name}>{r.name} ({r.role === 'admin' ? '관리자' : '기자'})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">해시태그</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none"
                            placeholder="예: #복지 #청년 #지원금 (쉼표 구분)"
                            value={formData.hashtags}
                            onChange={e => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Date & Updated At (Read-only/Edit) */}
                <div className="grid grid-cols-2 gap-6 bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">발행일 (기사 정렬 기준)</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full border border-gray-200 bg-gray-50 rounded-lg p-3 outline-none text-gray-400 font-medium"
                            value={formData.date ? new Date(formData.date).toLocaleString('ko-KR', {
                                timeZone: 'Asia/Seoul',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            }) : '작성 시 자동 생성'}
                        />
                        <p className="text-xs text-blue-500 mt-1">※ 발행일(최초 생성일)은 기사 정렬의 기준이며, 수정이 불가능합니다.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">최종 수정일 (자동 기록)</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full border border-gray-200 bg-gray-50 rounded-lg p-3 outline-none text-gray-400 font-medium"
                            value={formData.updated_at ? new Date(formData.updated_at).toLocaleString('ko-KR', {
                                timeZone: 'Asia/Seoul',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            }) : '신규 기사'}
                        />
                    </div>
                </div>

                {/* Publish Status - Restricted to Admin */}
                {userRole === 'admin' ? (
                    <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                        <span className="font-bold text-gray-700">홈페이지 게재 설정</span>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="published"
                                    checked={formData.status === 'published'}
                                    onChange={() => setFormData(prev => ({ ...prev, status: 'published' }))}
                                    className="w-5 h-5 text-primary"
                                />
                                <span className="font-medium">게재 (공개)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="draft"
                                    checked={formData.status === 'draft'}
                                    onChange={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                                    className="w-5 h-5 text-gray-500"
                                />
                                <span className="font-medium text-gray-500">미게재 (임시저장)</span>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="hidden">
                        {/* 기자는 기본적으로 published 상태로 저장됨 (혹은 기존 상태 유지) */}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-6">
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-blue-600 shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <Save size={20} />
                        {editId ? '수정사항 저장' : '기사 등록 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function WriteArticlePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WriteArticleForm />
        </Suspense>
    );
}
