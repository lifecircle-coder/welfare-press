'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { saveArticle, getUsers, getArticleById, getMenus, Article } from '@/lib/services';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';
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
        thumbnail: '',
        summary: '',
        content: '',
        category: '', 
        prefix: '', 
        author: '관리자',
        hashtags: '',
        status: 'published' as 'published' | 'draft',
        date: '',
        created_at: '',
        updated_at: '',
        link_button_text: '',
        link_url: ''
    });

    const [selectedCategories, setSelectedCategories] = useState<{ category: string, prefix: string }[]>([]);

    const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchMenus = async () => {
            const data = await getMenus(adminSupabase);
            
            // 트리 구조를 categoryMap 형태로 변환 (대분류: [소분류들])
            const map: Record<string, string[]> = {};
            const mainMenus = data.filter((m: any) => !m.parent_id && m.is_visible);
            
            mainMenus.forEach((main: any) => {
                const subMenus = data
                    .filter((m: any) => m.parent_id === main.id && m.is_visible)
                    .map((m: any) => m.name);
                map[main.name] = subMenus.length > 0 ? subMenus : ['일반'];
            });
            setCategoryMap(map);

            // 새 기사 작성 시 첫 번째 유효 카테고리로 초기화
            if (!editId && mainMenus.length > 0) {
                const firstCat = mainMenus[0].name;
                const firstPrefix = map[firstCat]?.[0] || '일반';
                setFormData(prev => ({ 
                    ...prev, 
                    category: firstCat,
                    prefix: firstPrefix
                }));
            }
        };
        fetchMenus();
    }, [editId]);
    // Load existing data if editing
    useEffect(() => {
        if (editId) {
            getArticleById(editId, adminSupabase).then(article => {
                if (article) {
                    try {
                        setFormData({
                            id: article.id,
                            title: article.title || '',
                            thumbnail: article.thumbnail || '',
                            summary: article.summary || '',
                            content: article.content || '',
                            category: article.category || '',
                            prefix: article.prefix || '',
                            author: article.author || '관리자',
                            hashtags: Array.isArray(article.hashtags)
                                ? article.hashtags.join(', ')
                                : (typeof article.hashtags === 'string' ? article.hashtags : ''),
                            status: (article.status as 'published' | 'draft') || 'published',
                            date: article.date || '',
                            created_at: article.created_at || '',
                            updated_at: article.updated_at || '',
                            link_button_text: article.link_button_text || '',
                            link_url: article.link_url || ''
                        });
                        
                        // 다중 카테고리 데이터 로드
                        if (article.category_list && Array.isArray(article.category_list)) {
                            setSelectedCategories(article.category_list);
                        } else if (article.category) {
                            // 기존 단일 카테고리 데이터가 있는 경우
                            setSelectedCategories([{ 
                                category: article.category, 
                                prefix: article.prefix || '일반' 
                            }]);
                        }
                    } catch (e) {
                        console.error('Error loading article data:', e);
                    }
                }
            });
        }
    }, [editId]);

    const addCategory = () => {
        if (!formData.category) return;
        
        const newCat = { category: formData.category, prefix: formData.prefix || '일반' };
        
        // 중복 체크
        const isDuplicate = selectedCategories.some(
            c => c.category === newCat.category && c.prefix === newCat.prefix
        );
        
        if (isDuplicate) {
            alert('이미 추가된 카테고리입니다.');
            return;
        }
        
        setSelectedCategories(prev => [...prev, newCat]);
    };

    const removeCategory = (index: number) => {
        setSelectedCategories(prev => prev.filter((_, i) => i !== index));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cat = e.target.value;
        setFormData(prev => ({
            ...prev,
            category: cat,
            prefix: categoryMap[cat]?.[0] || '일반'
        }));
    };
    const handleSave = async () => {
        if (selectedCategories.length === 0) return alert('최소 하나 이상의 카테고리를 선택해주세요.');

        // Use crypto.randomUUID() for new articles to match Supabase UUID type
        const newArticle: Article = {
            id: formData.id || crypto.randomUUID(),
            title: formData.title,
            thumbnail: formData.thumbnail,
            category_list: selectedCategories,
            category: selectedCategories[0].category, // 하위 호환성용
            prefix: selectedCategories[0].prefix,     // 하위 호환성용
            author: formData.author,
            created_at: formData.id ? (formData.created_at || undefined) : (formData.date || undefined),
            views: 0,
            status: formData.status,
            summary: formData.summary,
            content: formData.content,
            hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
            link_button_text: formData.link_button_text,
            link_url: formData.link_url
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

                {/* Thumbnail Image Selection */}
                <div className="p-6 bg-blue-50/30 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                        {formData.thumbnail ? (
                            <>
                                <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                    <X size={24} />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <Plus size={24} className="mx-auto text-gray-400 mb-1" />
                                <span className="text-[10px] text-gray-400 font-medium">이미지 없음</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        <label className="block text-sm font-bold text-gray-700">메인 썸네일 이미지</label>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            기사 리스트와 메인 화면에 노출될 대표 이미지입니다.<br />
                            선택하지 않으면 본문의 첫 번째 이미지가 자동으로 사용됩니다.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                id="thumbnail-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <label
                                htmlFor="thumbnail-upload"
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm transition-all active:scale-95"
                            >
                                이미지 선택
                            </label>
                            {formData.thumbnail && (
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                                    className="px-4 py-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">요약본 (썸네일/리스트 노출)</label>
                    <div className="bg-white rounded-lg">
                        <ClientQuillEditor
                            value={formData.summary}
                            onChange={(value: string) => setFormData(prev => ({ ...prev, summary: value }))}
                            articleId={formData.id}
                            height="60px"
                            placeholder="기사 요약 내용을 입력하세요..."
                        />
                    </div>
                </div>

                {/* Multi-Category Selection */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">기사 카테고리 설정 (다중 선택 가능)</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-gray-500 font-medium">대분류</span>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none bg-white font-medium"
                                value={formData.category}
                                onChange={handleCategoryChange}
                            >
                                <option value="" disabled>대분류 선택</option>
                                {Object.keys(categoryMap).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-gray-500 font-medium">소분류 (말머리)</span>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 border border-gray-300 rounded-lg p-3 outline-none bg-white font-medium"
                                    value={formData.prefix}
                                    onChange={e => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                                >
                                    {categoryMap[formData.category]?.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    )) || <option value="일반">일반</option>}
                                </select>
                                <button
                                    type="button"
                                    onClick={addCategory}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-1 hover:bg-black transition-colors"
                                >
                                    <Plus size={18} />
                                    추가
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Selected Categories Display (Chips) */}
                    <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-white rounded-md border border-dashed border-gray-300">
                        {selectedCategories.length === 0 ? (
                            <span className="text-sm text-gray-400 m-auto">카테고리를 추가해 주세요. (첫 번째 카테고리가 주 분류가 됩니다.)</span>
                        ) : (
                            selectedCategories.map((cat, idx) => (
                                <div 
                                    key={`${cat.category}-${cat.prefix}-${idx}`}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                        idx === 0 ? 'bg-primary text-white' : 'bg-blue-100 text-primary border border-blue-200'
                                    }`}
                                >
                                    <span>{cat.category} &gt; {cat.prefix}</span>
                                    <button 
                                        type="button"
                                        onClick={() => removeCategory(idx)}
                                        className={`hover:bg-black/10 rounded-full p-0.5 transition-colors ${idx === 0 ? 'text-white/80' : 'text-primary/80'}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">본문 (상세 내용)</label>
                    <div className="min-h-[500px] bg-white rounded-lg">
                        <ClientQuillEditor
                            value={formData.content}
                            onChange={(value: string) => setFormData(prev => ({ ...prev, content: value }))}
                            articleId={formData.id}
                        />
                    </div>
                </div>

                {/* Optional Link Button */}
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2">링크 (선택 사항)</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">버튼명</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="예: 자세히 보기, 신청하기"
                                value={formData.link_button_text}
                                onChange={e => setFormData(prev => ({ ...prev, link_button_text: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">링크 URL</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="https://..."
                                value={formData.link_url}
                                onChange={e => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                            />
                        </div>
                    </div>
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
                            value={formData.created_at || formData.date ? new Date(formData.created_at || formData.date).toLocaleString('ko-KR', {
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
