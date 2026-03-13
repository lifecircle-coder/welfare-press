'use client';

import { Plus, Search, Filter, Copy, Calendar, User, Trash2, MapPin, MessageCircle, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllArticles, deleteArticle, getComments, addComment, getArticlesWithNewComments } from '@/lib/services';
import type { Article, Comment } from '@/lib/services';
import { useRouter } from 'next/navigation';
import { getNationalWelfareList, getSubsidy24List, getYouthPolicyList, getMogefNewsList, getNationalWelfareDetail, getLocalGovWelfareList, getLocalGovWelfareDetail, getMcstPressReleaseList, getMcstNewsList, getMcstPhotoList, getMoisStatsList, WelfareService } from '@/lib/api/publicData';
import { adminSupabase } from '@/lib/supabaseClient';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: '_text',
});

export default function ArticleManagement() {
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('전체');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [newCommentArticleIds, setNewCommentArticleIds] = useState<string[]>([]);

    // Public Data State
    const [activeApiTab, setActiveApiTab] = useState<'NATIONAL' | 'LOCAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF' | 'MCST_PRESS' | 'MCST_NEWS' | 'MCST_PHOTO' | 'MOIS_STATS' | 'NEWS_ALL'>('MCST_PRESS');
    const [apiSearchTerm, setApiSearchTerm] = useState('');
    const [selectedApiItem, setSelectedApiItem] = useState<WelfareService | null>(null);

    // National (MOHW + MOGEF + SUBSIDY + YOUTH)
    const [apiData, setApiData] = useState<WelfareService[]>([]);
    const [isFetchingApi, setIsFetchingApi] = useState(false);

    // Local Gov
    const [localApiData, setLocalApiData] = useState<WelfareService[]>([]);
    const [isFetchingLocal, setIsFetchingLocal] = useState(false);

    // Copy tracking state: { [servId]: timestamp }
    const [copiedState, setCopiedState] = useState<Record<string, number>>({});
    // Deleted tracking state: { [servId]: boolean }
    const [deletedState, setDeletedState] = useState<Record<string, boolean>>({});

    // Comment Modal State
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [modalComments, setModalComments] = useState<Comment[]>([]);
    const [newAdminComment, setNewAdminComment] = useState('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [adminReplyContent, setAdminReplyContent] = useState('');

    const loadArticles = async () => {
        const data = await getAllArticles(100, 0, adminSupabase);

        // 최근 12시간 이내 새 댓글이 달린 기사 ID 조회
        const newComments = await getArticlesWithNewComments(12, adminSupabase);
        setNewCommentArticleIds(newComments);

        // Fetch current user and filter if reporter
        const { data: { session } } = await adminSupabase.auth.getSession();
        if (session?.user) {
            const role = session.user.user_metadata?.role;
            const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name;
            setCurrentUser({ id: session.user.id, role, name });

            if (role === 'reporter') {
                setArticles(data.filter(a => a.author === name));
            } else {
                setArticles(data);
            }
        } else {
            setArticles(data);
        }
    };

    // Load states from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('copiedPublicData');
            if (saved) {
                const parsed = JSON.parse(saved);
                const now = Date.now();
                const valid: Record<string, number> = {};
                for (const key in parsed) {
                    if (now - parsed[key] < 24 * 60 * 60 * 1000) {
                        valid[key] = parsed[key];
                    }
                }
                setCopiedState(valid);
                localStorage.setItem('copiedPublicData', JSON.stringify(valid));
            }
            const savedDeleted = localStorage.getItem('deletedPublicData');
            if (savedDeleted) {
                setDeletedState(JSON.parse(savedDeleted));
            }
        } catch (error) {
            console.error('Failed to load local state', error);
        }
    }, []);

    const loadApiData = async (tab: 'NATIONAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF' | 'MCST_PRESS' | 'MCST_NEWS' | 'MCST_PHOTO' | 'MOIS_STATS' | 'NEWS_ALL') => {
        setIsFetchingApi(true);
        try {
            let list: WelfareService[] = [];
            if (tab === 'NATIONAL') {
                list = await getNationalWelfareList(1, 100);
            } else if (tab === 'SUBSIDY') {
                list = await getSubsidy24List(1, 100);
            } else if (tab === 'YOUTH') {
                list = await getYouthPolicyList(1, 100);
            } else if (tab === 'MOGEF') {
                list = await getMogefNewsList(1, 100);
            } else if (tab === 'MCST_PRESS') {
                list = await getMcstPressReleaseList(1, 100);
            } else if (tab === 'MCST_NEWS') {
                list = await getMcstNewsList(1, 100);
            } else if (tab === 'MCST_PHOTO') {
                list = await getMcstPhotoList(1, 100);
            } else if (tab === 'MOIS_STATS') {
                list = await getMoisStatsList(1, 100);
            } else if (tab === 'NEWS_ALL') {
                const results = await Promise.all([
                    getMcstPressReleaseList(1, 30),
                    getMcstNewsList(1, 30),
                    getMogefNewsList(1, 30)
                ]);
                list = results.flat();
            }

            list.sort((a, b) => {
                // 우선순위 가중치 정렬 (1: 보도자료, 2: 정책뉴스/일반, 3: 복지정보, ...)
                const priorityA = a.priority || 99;
                const priorityB = b.priority || 99;
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                const dateA = String(a.svcfrstRegTs || '');
                const dateB = String(b.svcfrstRegTs || '');
                return dateB.localeCompare(dateA);
            });

            setApiData(list.slice(0, 100));
        } catch (error) {
            console.error('Failed to fetch public data', error);
        } finally {
            setIsFetchingApi(false);
        }
    };

    const loadLocalApiData = async () => {
        setIsFetchingLocal(true);
        try {
            const list = await getLocalGovWelfareList(1, 50);
            setLocalApiData(list || []);
        } catch (error) {
            console.error('Failed to fetch local gov data', error);
        } finally {
            setIsFetchingLocal(false);
        }
    };

    useEffect(() => {
        if (activeApiTab === 'LOCAL') {
            loadLocalApiData();
        } else {
            loadApiData(activeApiTab);
        }
    }, [activeApiTab]);

    useEffect(() => {
        loadArticles();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('정말로 삭제하시겠습니까?')) {
            await deleteArticle(id);
            loadArticles();
        }
    };

    const handleOpenCommentModal = async (article: Article) => {
        setSelectedArticle(article);
        setIsCommentModalOpen(true);
        const comments = await getComments(article.id, adminSupabase);
        setModalComments(comments);
    };

    const handlePostAdminComment = async (parentId?: string) => {
        if (!selectedArticle || !currentUser) return;
        const content = parentId ? adminReplyContent : newAdminComment;
        if (!content.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            articleId: selectedArticle.id,
            author: currentUser.name,
            content: content,
            date: new Date().toLocaleString('ko-KR'),
            parentId: parentId
        };

        await addComment(comment, adminSupabase);
        const updated = await getComments(selectedArticle.id, adminSupabase);
        setModalComments(updated);

        if (parentId) {
            setAdminReplyContent('');
            setReplyingToId(null);
        } else {
            setNewAdminComment('');
        }
    };

    const handleCopySource = async (api: WelfareService) => {
        try {
            let prompt = '';
            const sourceName = api.jurMnofNm || '정부 부처';
            const title = api.servNm;
            const summary = api.servDgst;
            const link = api.servDtlLink || '상세 페이지 참조';
            const keywords = (api.keywords || []).join(', ');

            // 왕 기자(AI Persona) 전용 지능형 프롬프트 템플릿
            if (api.apiSource === 'MCST_PRESS') {
                prompt = `[왕 기자 전용: 보도자료 기반 기사 작성 지침]

핵심 소스: 문화체육관광부 보도자료
기관명: ${sourceName}
기사 제목 후보: ${title}
데이터 요약: ${summary}
상세 URL: ${link}
키워드: ${keywords}

작성 지침:
1. 보도자료의 팩트를 기반으로 객관적이고 신뢰감 있는 신문사 톤앤매너를 유지하세요.
2. 독자가 혜택을 쉽게 이해할 수 있도록 'Q&A' 또는 '핵심 요약 3가지' 섹션을 포함하세요.
3. 전문 용어는 쉽게 풀어서 설명하고, 시행 일시와 장소를 명확히 강조해 주세요.`;
            } else if (api.apiSource === 'MCST_NEWS' || api.apiSource === 'MCST_PHOTO') {
                prompt = `[왕 기자 전용: 정책 뉴스 기반 기사 작성 지침]

뉴스 소스: 대한민국 정책뉴스
제목: ${title}
내용 요약: ${summary}
참고 URL: ${link}

작성 지침:
1. 최신 트렌드와 연결하여 독자들의 관심을 끌 수 있는 흥미로운 헤드라인을 뽑아주세요.
2. 정책이 우리 삶에 미치는 영향을 중심으로 '친근한 해설' 톤으로 작성하세요.
3. 정책 관련 댓글이나 소셜 미디어의 반응을 예상하여 보완하는 내용을 추가해 주세요.`;
            } else if (api.apiSource === 'NATIONAL' || api.apiSource === 'LOCAL' || api.apiSource === 'SUBSIDY') {
                prompt = `[왕 기자 전용: 복지/혜택 안내 기사 작성 지침]

지원 정책명: ${title}
소관 기관: ${sourceName}
주요 내용: ${summary}
신청 방법/링크: ${link}

작성 지침:
1. '신청 안 하면 손해!'라는 느낌의 실생활 체감형 복지 안내 기사로 작성하세요.
2. 신청 자격, 지원 금액, 신청 방법을 블렛 포인트로 선명하게 정리해 주세요.
3. 비슷한 다른 복지 제도와 비교하여 어떤 점이 좋은지 언급해 주면 좋습니다.`;
            } else {
                prompt = `[왕 기자 전용: 일반 정보 브리핑 지침]

제목: ${title}
내용: ${summary}
출처: ${sourceName}

작성 지침:
1. 위 정보를 토대로 독자들에게 유익한 정보성 블로그/뉴스 기사를 작성하세요.
2. 가독성 좋게 단락을 나누고 적절한 소제목을 붙여주세요.`;
            }

            await navigator.clipboard.writeText(prompt);
            const now = Date.now();
            const newCopied = { ...copiedState, [api.servId]: now };
            setCopiedState(newCopied);
            localStorage.setItem('copiedPublicData', JSON.stringify(newCopied));
            alert('왕 기자 전용 지능형 프롬프트가 복사되었습니다!\nAI 기자 창에 붙여넣기 하여 기사를 완성하세요.');
        } catch (error) {
            console.error('Failed to copy', error);
        }
    };

    const handleHidePublicData = (servId: string) => {
        const newDeleted = { ...deletedState, [servId]: true };
        setDeletedState(newDeleted);
        localStorage.setItem('deletedPublicData', JSON.stringify(newDeleted));
    };

    const displayApiData = apiData.filter(api => !deletedState[api.servId]);
    const displayLocalApiData = localApiData.filter(api => !deletedState[api.servId]);

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (a.content || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === '전체' || a.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">기사 관리 대시보드</h1>
                    <p className="text-gray-500 font-medium">실시간 정책 뉴스 및 복지 정보 브리핑</p>
                </div>
                <Link
                    href="/admin/articles/write"
                    className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
                >
                    <Plus size={20} />
                    새 기사 작성
                </Link>
            </div>

            {/* API News Briefing Area */}
            <div className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Filter size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">실시간 데이터 소스</h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <select
                        className="bg-transparent font-bold text-sm text-gray-700 outline-none cursor-pointer px-2"
                        value={activeApiTab}
                        onChange={(e) => setActiveApiTab(e.target.value as any)}
                    >
                        <optgroup label="뉴스 및 보도자료">
                            <option value="MCST_PRESS">정책브리핑 (보도자료)</option>
                            <option value="MCST_NEWS">정책뉴스 (브리핑)</option>
                            <option value="MCST_PHOTO">뉴스포토</option>
                            <option value="NEWS_ALL">종합 뉴스 브리핑</option>
                        </optgroup>
                        <optgroup label="정책 정보">
                            <option value="NATIONAL">중앙부처 통합 (복지로)</option>
                            <option value="MOGEF">여성가족부</option>
                            <option value="SUBSIDY">보조금24</option>
                            <option value="LOCAL">지자체 특화</option>
                            <option value="MOIS_STATS">통계 데이터</option>
                        </optgroup>
                    </select>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Search size={16} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="소스 내 키워드 검색..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={apiSearchTerm}
                            onChange={(e) => setApiSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {((activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.includes(apiSearchTerm) || api.servDgst.includes(apiSearchTerm))
                    ).length === 0 ? (
                        <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                            {isFetchingApi || isFetchingLocal ? '데이터를 불러오는 중입니다...' : '검색된 항목이 없습니다.'}
                        </div>
                    ) : (
                        (activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.includes(apiSearchTerm) || api.servDgst.includes(apiSearchTerm))
                        .map(api => {
                            const isCopied = !!copiedState[api.servId];
                            const getRelativeTime = (ds?: string | any) => {
                                if (!ds) return '최근';
                                const dsStr = String(ds);
                                if (dsStr.length < 8) return '최근';
                                const year = parseInt(dsStr.substring(0, 4));
                                const month = parseInt(dsStr.substring(4, 6)) - 1;
                                const day = parseInt(dsStr.substring(6, 8));
                                const date = new Date(year, month, day);
                                const now = new Date();
                                const diff = now.getTime() - date.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                if (days === 0) return '오늘';
                                if (days === 1) return '어제';
                                return `${days}일 전`;
                            };

                            const isNew = getRelativeTime(api.svcfrstRegTs).includes('오늘') || getRelativeTime(api.svcfrstRegTs).includes('어제');
                            const sourceLabels: any = {
                                'MCST_PRESS': { label: '보도자료', color: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
                                'MCST_NEWS': { label: '정책뉴스', color: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50' },
                                'MCST_PHOTO': { label: '뉴스포토', color: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50' },
                                'NATIONAL': { label: '중앙부처', color: 'bg-sky-600', text: 'text-sky-700', bg: 'bg-sky-50' },
                                'LOCAL': { label: '지자체', color: 'bg-orange-600', text: 'text-orange-700', bg: 'bg-orange-50' },
                                'SUBSIDY': { label: '보조금24', color: 'bg-green-600', text: 'text-green-700', bg: 'bg-green-50' },
                                'YOUTH': { label: '청년정책', color: 'bg-violet-600', text: 'text-violet-700', bg: 'bg-violet-50' },
                                'MOGEF': { label: '여가부', color: 'bg-pink-600', text: 'text-pink-700', bg: 'bg-pink-50' },
                                'MOIS_STATS': { label: '통계자료', color: 'bg-gray-600', text: 'text-gray-700', bg: 'bg-gray-50' }
                            };
                            const s = sourceLabels[api.apiSource || 'NATIONAL'];

                            return (
                                <div key={api.servId} className={`bg-white p-5 rounded-2xl border flex gap-4 transition-all group ${isCopied ? 'opacity-60 grayscale-[0.5]' : 'border-white hover:border-blue-200 hover:shadow-md'}`}>
                                    {(api.thumbnail || api.apiSource === 'MCST_PHOTO') && (
                                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-50 border">
                                            <img src={api.thumbnail || '/assets/images/placeholder.png'} alt="thumb" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {isNew && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">NEW</span>}
                                            {api.priority === 1 && <span className="border border-amber-200 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">중요</span>}
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
                                            <span className="text-[10px] text-gray-500 font-medium">{api.jurMnofNm}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 cursor-pointer" onClick={() => setSelectedApiItem(api)}>{api.servNm}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{api.servDgst}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {(api.keywords || []).slice(0, 2).map((kw, i) => (
                                                    <span key={i} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded leading-none">#{kw}</span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => !isCopied && handleCopySource(api)} className={`p-2 rounded-lg transition-colors ${isCopied ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                                                    <Copy size={16} />
                                                </button>
                                                <button onClick={() => setSelectedApiItem(api)} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Article Management List Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Calendar size={20} />
                        </div>
                        작성된 기사 목록
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-xs shadow-sm">
                            <Search size={14} className="text-gray-400" />
                            <input type="text" placeholder="기사 제목 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="outline-none" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 font-medium">제목</th>
                                <th className="p-4 font-medium">작성자</th>
                                <th className="p-4 font-medium">분류</th>
                                <th className="p-4 font-medium">상태</th>
                                <th className="p-4 font-medium">날짜</th>
                                <th className="p-4 font-medium">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredArticles.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/admin/articles/write?id=${item.id}`)}
                                >
                                    <td className="p-4 text-gray-900 font-medium truncate max-w-xs">{item.title}</td>
                                    <td className="p-4 text-gray-600">{item.author}</td>
                                    <td className="p-4"><span className="bg-blue-100 text-primary px-2 py-1 rounded text-[11px] font-bold">{item.category}</span></td>
                                    <td className="p-4">
                                        <span className={`font-bold ${item.status === 'published' ? 'text-green-600' : 'text-gray-400'}`}>
                                            ● {item.status === 'published' ? '게시중' : '임시저장'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenCommentModal(item)}
                                                className="flex items-center gap-1 text-primary hover:text-blue-700 border border-blue-100 px-2 py-1 rounded bg-blue-50/50 font-bold whitespace-nowrap"
                                            >
                                                <MessageCircle size={14} />
                                                댓글보기
                                            </button>
                                            <button onClick={() => router.push(`/admin/articles/write?id=${item.id}`)} className="text-gray-400 hover:text-gray-600 border px-2 py-1 rounded">수정</button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredArticles.length === 0 && (
                        <div className="p-12 text-center text-gray-500">등록된 기사가 없습니다.</div>
                    )}
                </div>
            </div>

            {/* Detail View Modal for API Item */}
            {selectedApiItem && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="relative h-48 bg-gray-900">
                            <img src={selectedApiItem.thumbnail || '/assets/images/placeholder.png'} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-6 left-8 right-16">
                                <div className="flex gap-2 mb-2">
                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">SOURCE</span>
                                    <span className="text-blue-200 text-xs font-medium">{selectedApiItem.jurMnofNm}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white line-clamp-2">{selectedApiItem.servNm}</h3>
                            </div>
                            <button onClick={() => setSelectedApiItem(null)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <section>
                                <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                    정책 요약
                                </h4>
                                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl">{selectedApiItem.servDgst || '요약 정보가 없습니다.'}</p>
                            </section>
                            {selectedApiItem.servDtlLink && (
                                <section>
                                    <h4 className="text-sm font-black text-gray-900 mb-3">원본 링크</h4>
                                    <a href={selectedApiItem.servDtlLink} target="_blank" className="text-blue-600 text-sm hover:underline break-all">{selectedApiItem.servDtlLink}</a>
                                </section>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex gap-3">
                            <button onClick={() => handleCopySource(selectedApiItem)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                <Copy size={18} /> 기사 소스 복사 (프롬프트 추출)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
