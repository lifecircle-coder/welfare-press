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

    // Status tracking state: { [servId]: 'copied' | 'writing' | 'completed' }
    const [apiStatusHistory, setApiStatusHistory] = useState<Record<string, string>>({});
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
                // Migrating old timestamp format to new status format if needed
                const migrated: Record<string, string> = {};
                for (const key in parsed) {
                    if (typeof parsed[key] === 'number') {
                        migrated[key] = 'copied';
                    } else {
                        migrated[key] = parsed[key];
                    }
                }
                setApiStatusHistory(migrated);
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
        setApiData([]); // 이전 데이터 즉시 초기화 (중요: 레이블 꼬임 방지)
        try {
            let list: WelfareService[] = [];
            if (tab === 'NATIONAL') {
                list = await getNationalWelfareList(1, 50);
            } else if (tab === 'SUBSIDY') {
                list = await getSubsidy24List(1, 50);
            } else if (tab === 'YOUTH') {
                list = await getYouthPolicyList(1, 50);
            } else if (tab === 'MOGEF') {
                list = await getMogefNewsList(1, 50);
            } else if (tab === 'MCST_PRESS') {
                list = await getMcstPressReleaseList(1, 40); // 100 -> 40으로 축소 (500 에러 방지용)
            } else if (tab === 'MCST_NEWS') {
                list = await getMcstNewsList(1, 40);
            } else if (tab === 'MCST_PHOTO') {
                list = await getMcstPhotoList(1, 40);
            } else if (tab === 'MOIS_STATS') {
                list = await getMoisStatsList(1, 50);
            } else if (tab === 'NEWS_ALL') {
                const results = await Promise.all([
                    getMcstPressReleaseList(1, 20),
                    getMcstNewsList(1, 20),
                    getMogefNewsList(1, 20)
                ]);
                list = results.flat();
            }

            list.sort((a, b) => {
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
        setLocalApiData([]); // 이전 데이터 즉시 초기화 (중요: 레이블 꼬임 방지)
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
            const sourceName = api.jurMnofNm || '공공기관';
            const title = api.servNm;
            const summary = api.servDgst;
            const link = api.servDtlLink || '상세 페이지 참조';
            const keywords = (api.keywords || []).length > 0 ? (api.keywords || []).join(', ') : '복지, 정책, 뉴스';

            // [스토리보드 반영] 왕 기자(AI Persona) 지능형 프롬프트 시스템
            if (api.apiSource === 'MCST_PRESS') {
                prompt = `[왕 기자 전용: 보도자료 기반 팩트체크 리포트]

핵심 소스: 문화체육관광부 정책브리핑 (보도자료)
소속 기관: ${sourceName}
헤드라인(원문): ${title}
데이터 요약: ${summary}
상세 URL: ${link}
핵심 키워드: ${keywords}

작성 지침 (보도자료형):
1. '팩트 위주의 뉴스 브리핑' 형태를 유지하며, 정부의 공식 입장을 독자들에게 신뢰감 있게 전달하세요.
2. 기사 도입부에 '이 정책이 왜 중요한지' 한 문장으로 정의하고 시작하세요.
3. [누가, 언제, 무엇을, 어떻게] 수혜를 받는지 표(Table) 또는 리스트 형태로 일목요연하게 정리하세요.
4. 마지막에는 정책 담당 부서와 연락처(있는 경우)를 명시하여 독자의 편의를 돕습니다.`;
            } else if (api.apiSource === 'MCST_NEWS' || api.apiSource === 'MCST_PHOTO') {
                prompt = `[왕 기자 전용: 정책 뉴스 기반 스토리텔링 지능형 프롬프트]

뉴스 소스: 정책브리핑 전문 뉴스/포토
기사 제목: ${title}
내용 요약: ${summary}
참고 URL: ${link}

작성 지침 (스토리텔링형):
1. 딱딱한 정책 발표가 아닌, 실생활에 적용된 '사례' 중심의 친근한 해설 기사로 작성하세요.
2. '왕 기자' 특유의 날카로운 분석을 더해, 이 정책이 가져올 기대효과 3가지를 도출하세요.
3. 시각적으로 돋보이도록 적절한 소제목(Sub-heading)을 3개 이상 사용하세요.
4. 독자 초청 멘트나 궁금증을 유발하는 질문으로 기사를 마무리하세요.`;
            } else if (api.apiSource === 'NATIONAL' || api.apiSource === 'LOCAL' || api.apiSource === 'SUBSIDY' || api.apiSource === 'MOGEF') {
                prompt = `[왕 기자 전용: 복지 서비스 수혜자 중심 가이드]

서비스명: ${title}
제공 기관: ${sourceName}
서비스 요약: ${summary}
신청 링크: ${link}

작성 지침 (수혜자 맞춤형):
1. '당신을 위한 맞춤 복지'라는 컨셉으로, 2030 청년 또는 6070 시니어 등 핵심 타겟을 명확히 설정하여 작성하세요.
2. '쉬운 요약' 박스를 상단에 배치하고, 전문 용어 대신 일상 용어를 사용하세요.
3. "이런 분들은 꼭 신청하세요!" 섹션을 만들어 자격 요건을 강조하세요.
4. 기사 끝에 글자 크기 조절 버튼이 있다는 점을 언급하여 접근성을 강조하세요.`;
            } else if (api.apiSource === 'MOIS_STATS') {
                prompt = `[왕 기자 전용: 데이터 인사이트 분석 리포트]

통계 데이터: ${title}
출처: 행정안전부 (보도자료/통계)
데이터 개요: ${summary}

작성 지침 (데이터 분석형):
1. 숫자가 주는 의미를 파악하여 '데이터로 보는 복지 현황' 테마로 작성하세요.
2. 과거 데이터나 다른 지표와 비교하여 증가/감소 추세를 분석해 주세요.
3. 통계 결과가 시사하는 사회적 메시지를 '왕 기자'의 논평으로 정리하세요.
4. 인포그래픽을 보는 듯한 텍스트 구조(도표화)를 사용하세요.`;
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
            const newHistory = { ...apiStatusHistory, [api.servId]: 'copied' };
            setApiStatusHistory(newHistory);
            localStorage.setItem('copiedPublicData', JSON.stringify(newHistory));
            alert('🚀 왕 기자 전용 지능형 프롬프트가 복사되었습니다!\n기사 작성 창의 AI 프롬프트 입력란에 붙여넣으세요.');
        } catch (error) {
            console.error('Failed to copy', error);
        }
    };

    const handleUpdateStatus = (servId: string, status: string) => {
        const newHistory = { ...apiStatusHistory, [servId]: status };
        setApiStatusHistory(newHistory);
        localStorage.setItem('copiedPublicData', JSON.stringify(newHistory));
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

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <div className="flex bg-white p-1 rounded-xl border border-blue-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { id: 'MCST_PRESS', label: '보도자료', icon: '📢' },
                            { id: 'MCST_NEWS', label: '정책뉴스', icon: '🗞️' },
                            { id: 'MCST_PHOTO', label: '뉴스포토', icon: '📸' },
                            { id: 'NEWS_ALL', label: '종합뉴스', icon: '⚡' },
                            { id: 'NATIONAL', label: '중앙부처', icon: '🏛️' },
                            { id: 'LOCAL', label: '지자체', icon: '📍' },
                            { id: 'SUBSIDY', label: '보조금24', icon: '💰' },
                            { id: 'MOGEF', label: '여가부', icon: '👪' },
                            { id: 'MOIS_STATS', label: '통계', icon: '📊' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveApiTab(tab.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                                    ${activeApiTab === tab.id 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100 scale-105' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm ml-auto min-w-[240px]">
                        <Search size={16} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="뉴스 소스 내 통합 검색..."
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                            value={apiSearchTerm}
                            onChange={(e) => setApiSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div 
                    key={activeApiTab} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
                >
                    {((activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.toLowerCase().includes(apiSearchTerm.toLowerCase()) || api.servDgst.toLowerCase().includes(apiSearchTerm.toLowerCase()))
                    ).length === 0 ? (
                        <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                            {isFetchingApi || isFetchingLocal ? '데이터를 불러오는 중입니다...' : '검색된 항목이 없습니다.'}
                        </div>
                    ) : (
                        (activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.toLowerCase().includes(apiSearchTerm.toLowerCase()) || api.servDgst.toLowerCase().includes(apiSearchTerm.toLowerCase()))
                        .map(api => {
                            const status = apiStatusHistory[api.servId] || 'default';
                            
                            const getRelativeTimeInfo = (ds?: string | any) => {
                                if (!ds) return { text: '최근', isNew: false, dDay: null };
                                const dsStr = String(ds).replace(/[^0-9]/g, '');
                                if (dsStr.length < 8) return { text: '최근', isNew: false, dDay: null };
                                const year = parseInt(dsStr.substring(0, 4));
                                const month = parseInt(dsStr.substring(4, 6)) - 1;
                                const day = parseInt(dsStr.substring(6, 8));
                                const date = new Date(year, month, day);
                                if (isNaN(date.getTime())) return { text: '최근', isNew: false, dDay: null };
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);
                                date.setHours(0, 0, 0, 0);
                                const diff = now.getTime() - date.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                
                                const dateLabel = `${year}.${(month+1).toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`;
                                
                                if (days === 0) return { text: '오늘', isNew: true, dDay: 'Today' };
                                if (days === 1) return { text: '어제', isNew: true, dDay: 'D-1' };
                                if (days > 1 && days < 7) return { text: `${days}일 전`, isNew: false, dDay: `D-${days}` };
                                return { text: dateLabel, isNew: false, dDay: null };
                            };

                            const timeInfo = getRelativeTimeInfo(api.svcfrstRegTs);
                            
                            const sourceLabels: any = {
                                'MCST_PRESS': { label: '보도자료', color: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50', icon: '📢' },
                                'MCST_NEWS': { label: '정책뉴스', color: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50', icon: '🗞️' },
                                'MCST_PHOTO': { label: '뉴스포토', color: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50', icon: '📸' },
                                'NATIONAL': { label: '중앙부처', color: 'bg-sky-600', text: 'text-sky-700', bg: 'bg-sky-50', icon: '🏛️' },
                                'LOCAL': { label: '지자체', color: 'bg-orange-600', text: 'text-orange-700', bg: 'bg-orange-50', icon: '📍' },
                                'SUBSIDY': { label: '보조금24', color: 'bg-green-600', text: 'text-green-700', bg: 'bg-green-50', icon: '💰' },
                                'YOUTH': { label: '청년정책', color: 'bg-violet-600', text: 'text-violet-700', bg: 'bg-violet-50', icon: '✨' },
                                'MOGEF': { label: '여가부', color: 'bg-pink-600', text: 'text-pink-700', bg: 'bg-pink-50', icon: '👪' },
                                'MOIS_STATS': { label: '통계자료', color: 'bg-gray-700', text: 'text-gray-700', bg: 'bg-gray-100', icon: '📊' }
                            };
                            const s = sourceLabels[api.apiSource || 'NATIONAL'] || sourceLabels['NATIONAL'];

                            return (
                                <div 
                                    key={api.servId} 
                                    className={`relative overflow-hidden bg-white p-5 rounded-2xl border transition-all duration-300 flex gap-4 group 
                                        ${status === 'completed' 
                                            ? 'border-green-200 bg-green-50 hover:shadow-green-100' 
                                            : status === 'writing' 
                                                ? 'border-amber-200 bg-amber-50 shadow-inner'
                                                : status === 'copied'
                                                    ? 'bg-gray-50 border-gray-100'
                                                    : 'border-white hover:border-blue-200 hover:shadow-xl hover:-translate-y-1'}`}
                                >
                                    {/* Status Selector UI */}
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 overflow-hidden rounded-lg bg-white/60 backdrop-blur-sm p-1 border border-white/40 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <select 
                                            value={status} 
                                            onChange={(e) => handleUpdateStatus(api.servId!, e.target.value)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer outline-none transition-colors
                                                ${status === 'completed' ? 'bg-green-500 text-white' : 
                                                  status === 'writing' ? 'bg-amber-500 text-white' : 
                                                  status === 'copied' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            <option value="default">상세 전</option>
                                            <option value="copied">복사함</option>
                                            <option value="writing">작성 중</option>
                                            <option value="completed">작성완료</option>
                                        </select>
                                    </div>

                                    {/* Quick Badge for no-hover state */}
                                    {status !== 'default' && (
                                        <div className={`absolute top-2 right-2 z-0 px-2 py-0.5 rounded text-[9px] font-black shadow-sm group-hover:opacity-0 transition-opacity
                                            ${status === 'completed' ? 'bg-green-500 text-white' : 
                                              status === 'writing' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                                            {status === 'completed' ? '완료' : status === 'writing' ? '작성중' : '복사함'}
                                        </div>
                                    )}

                                    {/* Thumbnail or Icon */}
                                    {(api.thumbnail || api.apiSource === 'MCST_PHOTO') ? (
                                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 border relative group-hover:ring-2 ring-blue-100 transition-all">
                                            <img 
                                                src={api.thumbnail || '/assets/images/placeholder.png'} 
                                                alt="thumb" 
                                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${status === 'completed' ? 'opacity-60' : ''}`} 
                                            />
                                        </div>
                                    ) : (
                                        <div className={`w-24 h-24 rounded-xl shrink-0 flex items-center justify-center text-3xl border transition-all duration-300
                                            ${status === 'completed' ? 'bg-green-100 border-green-200 text-green-600' : 
                                              status === 'writing' ? 'bg-amber-100 border-amber-200 text-amber-600' :
                                              status === 'copied' ? 'bg-gray-100 border-gray-200 opacity-60' : s.bg + ' ' + s.text + ' border-transparent group-hover:scale-105'}`}>
                                            {s.icon}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap pr-8">
                                                {timeInfo.isNew && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse shadow-sm">NEW</span>}
                                                {timeInfo.dDay && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm">{timeInfo.dDay}</span>}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'completed' ? 'bg-green-200 text-green-700' : s.bg + ' ' + s.text}`}>{s.label}</span>
                                                <span className={`text-[10px] font-medium ${status === 'completed' ? 'text-green-400' : 'text-gray-400'}`}>| {api.jurMnofNm}</span>
                                            </div>
                                            <h4 
                                                className={`font-bold mb-1 line-clamp-1 transition-colors cursor-pointer ${status === 'completed' ? 'text-green-800' : 'text-gray-900 group-hover:text-blue-600'}`}
                                                onClick={() => setSelectedApiItem(api)}
                                            >
                                                {api.servNm || '제목 없음'}
                                            </h4>
                                            <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${status === 'completed' ? 'text-green-600/70' : 'text-gray-500'}`}>
                                                {api.servDgst || '상세 내용을 확인하려면 상세보기 버튼을 클릭하세요.'}
                                            </p>
                                        </div>

                                        <div className={`flex items-center justify-between border-t pt-2 ${status === 'completed' ? 'border-green-100' : 'border-gray-50'}`}>
                                            <div className="flex gap-1 items-center flex-wrap max-w-[70%]">
                                                {(api.keywords || ['복지', '정책']).slice(0, 2).map((kw, i) => (
                                                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded leading-none ${status === 'completed' ? 'bg-green-100 text-green-500' : 'text-blue-400 bg-blue-50/50'}`}>#{kw}</span>
                                                ))}
                                                <span className={`text-[9px] ml-1 font-medium italic ${status === 'completed' ? 'text-green-300' : 'text-gray-300'}`}>{timeInfo.text}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleCopySource(api)} 
                                                    className={`p-2 rounded-lg transition-all duration-300 shadow-sm
                                                        ${status === 'completed' 
                                                            ? 'bg-green-600 text-white hover:bg-green-700' 
                                                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
                                                    title="왕 기자 프롬프트 복사"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedApiItem(api)} 
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${status === 'completed' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}
                                                    title="상세보기"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Premium glassmorphism highlight on hover */}
                                    {status === 'default' && <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
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
                                    <td className="p-4 text-gray-400">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
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
                                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl whitespace-pre-wrap">{selectedApiItem.servDgst || '요약 정보가 없습니다.'}</p>
                            </section>

                            {selectedApiItem.fullContent && selectedApiItem.fullContent !== selectedApiItem.servDgst && (
                                <section>
                                    <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                        상세 정보 (기사용 소스)
                                    </h4>
                                    <div className="text-gray-600 text-sm leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-100 whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {selectedApiItem.fullContent}
                                    </div>
                                </section>
                            )}
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
