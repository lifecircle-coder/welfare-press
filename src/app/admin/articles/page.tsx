'use client';

import { Plus, Search, Filter, Copy, Calendar, User, Trash2, MapPin, MessageCircle, Send, X, RotateCcw, Briefcase, Home, GraduationCap, Heart, Users } from 'lucide-react';
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
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [newCommentArticleIds, setNewCommentArticleIds] = useState<string[]>([]);

    // Advanced Search States
    const [allMenus, setAllMenus] = useState<any[]>([]);
    const [mainCategories, setMainCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    
    const [searchFilters, setSearchFilters] = useState({
        mainCategory: '전체',
        subCategory: '전체',
        status: '전체',
        dateType: 'created', // created(게재일), updated(수정일)
        startDate: '',
        endDate: '',
        keyword: ''
    });
    
    // 이 상태가 실제로 목록 필터링에 사용됩니다 (검색 버튼 클릭 시 업데이트)
    const [appliedFilters, setAppliedFilters] = useState(searchFilters);

    // Public Data State
    const [activeApiTab, setActiveApiTab] = useState<'NATIONAL' | 'LOCAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF' | 'MCST_PRESS' | 'MCST_NEWS' | 'MCST_PHOTO' | 'MOIS_STATS' | 'NEWS_ALL'>('MCST_PRESS');
    const [apiSearchTerm, setApiSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
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
    
    // Youth Policy Specific Filters (Multi-select)
    const [youthCategories, setYouthCategories] = useState<string[]>(['전체']);
    const [youthRegions, setYouthRegions] = useState<string[]>(['전체']);

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

    const loadMenus = async () => {
        const { data } = await adminSupabase
            .from('menus')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (data) {
            setAllMenus(data);
            setMainCategories(data.filter(m => !m.parent_id));
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
                list = await getNationalWelfareList(1, 1000); 
            } else if (tab === 'SUBSIDY') {
                list = await getSubsidy24List(1, 500); // 50 -> 500: Give more data for filtering
            } else if (tab === 'YOUTH') {
                const yCat = youthCategories.includes('전체') ? '' : youthCategories.join(',');
                const yReg = youthRegions.includes('전체') ? '' : youthRegions.join(',');
                list = await getYouthPolicyList(1, 500, yCat, yReg, apiSearchTerm);
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
                    getMcstPressReleaseList(1, 40),
                    getMcstNewsList(1, 40),
                    getMogefNewsList(1, 40)
                ]);
                list = results.flat();
            }

            list.sort((a, b) => {
                // Ensure 2026/2025 data stays at TOP by sorting date DESC first
                const dateA = String(a.svcfrstRegTs || '').replace(/[^0-9]/g, '');
                const dateB = String(b.svcfrstRegTs || '').replace(/[^0-9]/g, '');
                if (dateA && dateB && dateA !== dateB) {
                    return dateB.localeCompare(dateA);
                }
                const priorityA = a.priority || 99;
                const priorityB = b.priority || 99;
                return priorityA - priorityB;
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


    // Youth Filter Toggle Handlers
    const toggleYouthCategory = (id: string) => {
        if (id === '전체') {
            setYouthCategories(['전체']);
        } else {
            setYouthCategories(prev => {
                const filtered = prev.filter(c => c !== '전체');
                if (filtered.includes(id)) {
                    const next = filtered.filter(c => c !== id);
                    return next.length === 0 ? ['전체'] : next;
                } else {
                    return [...filtered, id];
                }
            });
        }
    };

    const toggleYouthRegion = (id: string) => {
        if (id === '전체') {
            setYouthRegions(['전체']);
        } else {
            setYouthRegions(prev => {
                const filtered = prev.filter(c => c !== '전체');
                if (filtered.includes(id)) {
                    const next = filtered.filter(c => c !== id);
                    return next.length === 0 ? ['전체'] : next;
                } else {
                    return [...filtered, id];
                }
            });
        }
    };

    useEffect(() => {
        setClientFilter(''); // Reset life-cycle filter when tab changes
        if (activeApiTab === 'LOCAL') {
            loadLocalApiData();
        } else {
            loadApiData(activeApiTab);
        }
    }, [activeApiTab]); // Disconnected from filters to use Search Button

    useEffect(() => {
        loadArticles();
        loadMenus(); // 메뉴 데이터 로드
    }, []);

    // 대분류 선택 시 소분류 목록 업데이트
    useEffect(() => {
        if (searchFilters.mainCategory === '전체') {
            setSubCategories([]);
            setSearchFilters(prev => ({ ...prev, subCategory: '전체' }));
        } else {
            const mainId = allMenus.find(m => m.name === searchFilters.mainCategory)?.id;
            const subs = allMenus.filter(m => m.parent_id === mainId);
            setSubCategories(subs);
            setSearchFilters(prev => ({ ...prev, subCategory: '전체' }));
        }
    }, [searchFilters.mainCategory, allMenus]);

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
            // 1. 메뉴/카테고리 목록 데이터화 (AI가 선택할 수 있도록 제공)
            const menuListText = allMenus
                .filter(m => m.parent_id) // 소분류만 추출
                .map(sub => {
                    const parent = allMenus.find(m => m.id === sub.parent_id);
                    return `${parent?.name || '미분류'} > ${sub.name}`;
                })
                .join('\n- ');

            // 2. 탭별 저널리즘 전략 설정
            const strategies: Record<string, { type: string, structure: string, angle: string }> = {
                'MCST_PRESS': { type: '스트레이트 뉴스', structure: '역피라미드 구조', angle: '정부 발표를 5W1H 기반으로 재구성하는 팩트 중심 속보' },
                'YOUTH': { type: '서비스 저널리즘', structure: '다이아몬드 구조', angle: '"이 정책, 나도 받을 수 있을까?" 수혜자 관점의 실용 가이드' },
                'MCST_NEWS': { type: '정책 해설', structure: '다이아몬드 구조', angle: '정책이 국민 삶에 미치는 영향을 분석하는 "So What?" 관점' },
                'NEWS_ALL': { type: '종합 브리핑', structure: '역피라미드 구조', angle: '복수 소스를 횡단하며 핵심만 짚는 압축 브리핑' },
                'NATIONAL': { type: '복지 서비스 가이드', structure: '다이아몬드 구조', angle: '"이런 분은 꼭 신청하라" — 수혜 자격 중심 복지 안내' },
                'LOCAL': { type: '지역 밀착 복지 보도', structure: '다이아몬드 구조', angle: '"우리 동네에서 받을 수 있는 복지" — 지역 특화 관점' },
                'MOIS_STATS': { type: '데이터 분석 리포트', structure: '역피라미드+분석', angle: '숫자 뒤에 숨은 이야기 — 트렌드 해석과 사회적 시사점' }
            };

            const strategy = strategies[api.apiSource || 'NATIONAL'] || strategies['NATIONAL'];
            const sourceName = api.jurMnofNm || api.deptNm || '공공기관';
            const rawContent = api.fullContent || api.servDgst || api.summary;

            // 3. 변 기자 페르소나 및 출력 형식 고도화 프롬프트
            const prompt = `
당신은 대한민국 최고의 복지 전문 뉴스 매체 '복지프레스'의 베테랑 기자인 '변 기자'다.
제공된 원본 데이터를 바탕으로 독자들에게 가장 유익하고 신뢰할 수 있는 기사를 작성하라.

■ 원본 데이터
- 소스 기관: ${sourceName}
- 원문 제목: ${api.servNm || api.title}
- 원문 내용: ${rawContent}
- 원문 URL: ${api.servDtlLink || api.link || '상세 페이지 참조'}

■ 기사 작성 지침
1. 기사 유형: ${strategy.type} (${strategy.structure})
2. 관점(Angle): ${strategy.angle}
3. 문체: 단호하고 객관적인 '해라체' 사용. 한 문장은 50~70자 이내의 단문 위주로 구성할 것.
4. 난이도: 중학생 수준이면 누구나 이해할 수 있도록 행정 용어(예: 수혜자, 가점 등)를 쉬운 일상 용어로 순화할 것.
5. 구성:
   - [제목]: 핵심 키워드와 숫자를 전진 배치하여 SEO를 최적화하라 (예: '최대 100만원 지원', '3월부터 신청' 등).
   - [요약본]: 기사의 핵심 내용을 3개의 불렛 포인트로 정리하라 (최대 3줄).
   - [부제]: 본문의 핵심 내용을 한눈에 관통하는 임팩트 있는 문장 (최대 2줄).
   - [본문]: 소제목을 활용하여 가독성을 높이고, 신청 방법이나 지원 대상 등은 반드시 불렛 포인트를 사용하여 시각화하라.
   - [해시태그]: 기사 내용과 관련된 핵심 키워드 3~5개를 # 형식으로 생성하라.

■ 기사 카테고리 선정
아래 메뉴 목록 중 이 기사에 가장 적합한 '대분류 > 소분류'를 하나만 선택하여 기사 최상단에 기재하라.
- ${menuListText}

■ 출력 형식 (아래 형식을 엄격히 준수할 것)
[카테고리: 대분류 > 소분류]

제목: 
(헤드라인)

요약본:
(불렛 포인트 3개, 최대 3줄)

부제:
(소제목, 최대 2줄)

본문:
(상세 기사 내용)

해시태그:
(키워드 3~5개)
`.trim();

            await navigator.clipboard.writeText(prompt);
            const newHistory = { ...apiStatusHistory, [api.servId]: 'copied' };
            setApiStatusHistory(newHistory);
            localStorage.setItem('copiedPublicData', JSON.stringify(newHistory));
            alert('🚀 "변 기자" 고품질 복지 뉴스 가이드라인이 반영된 프롬프트가 복사되었습니다!');
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

    const handleSearch = () => {
        setAppliedFilters(searchFilters);
    };

    const handleReset = () => {
        const initial = {
            mainCategory: '전체',
            subCategory: '전체',
            status: '전체',
            dateType: 'created',
            startDate: '',
            endDate: '',
            keyword: ''
        };
        setSearchFilters(initial);
        setAppliedFilters(initial);
    };

    const filteredArticles = articles.filter(a => {
        // 1. 검색어 필터 (제목 또는 내용)
        const matchesKeyword = !appliedFilters.keyword || 
                               a.title.toLowerCase().includes(appliedFilters.keyword.toLowerCase()) || 
                               (a.content || '').toLowerCase().includes(appliedFilters.keyword.toLowerCase());
        
        // 2. 대분류 필터 (가장 중요: category_list 내부에 하나라도 포함되어 있는지 확인)
        const matchesMainCategory = appliedFilters.mainCategory === '전체' || 
                                   a.category === appliedFilters.mainCategory || 
                                   (a.category_list && a.category_list.some(c => c.category === appliedFilters.mainCategory));
        
        // 3. 소분류 필터 (prefix)
        const matchesSubCategory = appliedFilters.subCategory === '전체' || 
                                  a.prefix === appliedFilters.subCategory ||
                                  (a.category_list && a.category_list.some(c => c.prefix === appliedFilters.subCategory));
        
        // 4. 상태 필터 (게시중/임시저장)
        const matchesStatus = appliedFilters.status === '전체' || 
                              (appliedFilters.status === '게시중' && a.status === 'published') ||
                              (appliedFilters.status === '미게재' && a.status === 'draft');
        
        // 5. 날짜 필터
        let matchesDate = true;
        const targetDateStr = appliedFilters.dateType === 'created' ? a.date : a.updated_at;
        
        if (targetDateStr && (appliedFilters.startDate || appliedFilters.endDate)) {
            const targetDate = new Date(targetDateStr);
            targetDate.setHours(0, 0, 0, 0);

            if (appliedFilters.startDate) {
                const startDate = new Date(appliedFilters.startDate);
                startDate.setHours(0, 0, 0, 0);
                if (targetDate < startDate) matchesDate = false;
            }
            if (appliedFilters.endDate) {
                const endDate = new Date(appliedFilters.endDate);
                endDate.setHours(0, 0, 0, 0);
                if (targetDate > endDate) matchesDate = false;
            }
        } else if (!targetDateStr && (appliedFilters.startDate || appliedFilters.endDate)) {
            matchesDate = false; // 날짜 데이터가 없는데 필터가 설정된 경우
        }

        return matchesKeyword && matchesMainCategory && matchesSubCategory && matchesStatus && matchesDate;
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
                            { id: 'YOUTH', label: '청년정책', icon: '✨' },
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

                    {/* Quick Life-cycle Filters - Client Side (Ensures 2026 Data Freshness) */}
                    {activeApiTab === 'NATIONAL' && (
                        <div className="flex gap-1.5 bg-blue-100/50 p-1 rounded-xl border border-blue-200/50">
                            {[
                                { label: '영유아', color: 'text-pink-600', bg: 'hover:bg-pink-50' },
                                { label: '청년', color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
                                { label: '어르신', color: 'text-orange-600', bg: 'hover:bg-orange-50' }
                            ].map((filter) => (
                                <button
                                    key={filter.label}
                                    onClick={() => setClientFilter(filter.label === clientFilter ? '' : filter.label)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${filter.bg} ${filter.color} 
                                        ${clientFilter === filter.label ? 'bg-white shadow-sm ring-1 ring-blue-200' : ''}`}
                                >
                                    #{filter.label}
                                </button>
                            ))}
                            {clientFilter && (
                                <button 
                                    onClick={() => setClientFilter('')}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    title="필터 해제"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}
                    
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

                {/* Youth Policy Filter Panel (Shown only for YOUTH tab) */}
                {activeApiTab === 'YOUTH' && (
                    <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        {/* Category Icons */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {[
                                { id: '전체', label: '전체', icon: <RotateCcw size={20} />, color: 'bg-gray-100 text-gray-600' },
                                { id: '일자리', label: '일자리', icon: <Briefcase size={20} />, color: 'bg-blue-100 text-blue-600' },
                                { id: '주거', label: '주거', icon: <Home size={20} />, color: 'bg-green-100 text-green-600' },
                                { id: '교육·훈련', label: '교육·훈련', icon: <GraduationCap size={20} />, color: 'bg-purple-100 text-purple-600' },
                                { id: '복지·문화', label: '복지·문화', icon: <Heart size={20} />, color: 'bg-pink-100 text-pink-600' },
                                { id: '참여·기반', label: '참여·기반', icon: <Users size={20} />, color: 'bg-amber-100 text-amber-600' },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleYouthCategory(cat.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border-2 
                                        ${youthCategories.includes(cat.id) 
                                            ? 'border-blue-500 bg-blue-50/50 shadow-md scale-105' 
                                            : 'border-transparent bg-white hover:bg-gray-50 hover:border-gray-100'}`}
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 shadow-sm ${cat.color}`}>
                                {cat.icon}
                                    </div>
                                    <span className={`text-[10px] sm:text-[11px] font-bold ${youthCategories.includes(cat.id) ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {cat.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Region Buttons */}
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-blue-50 shadow-sm relative">
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 pr-24">
                                {[
                                    { id: '전체', label: '전체' },
                                    { id: '003002000', label: '중앙부처' },
                                    { id: '11000', label: '서울' },
                                    { id: '41000', label: '경기' },
                                    { id: '28000', label: '인천' },
                                    { id: '26000', label: '부산' },
                                    { id: '27000', label: '대구' },
                                    { id: '29000', label: '광주' },
                                    { id: '30000', label: '대전' },
                                    { id: '31000', label: '울산' },
                                    { id: '36000', label: '세종' },
                                    { id: '42000', label: '강원' },
                                    { id: '43000', label: '충북' },
                                    { id: '44000', label: '충남' },
                                    { id: '45000', label: '전북' },
                                    { id: '46000', label: '전남' },
                                    { id: '47000', label: '경북' },
                                    { id: '48000', label: '경남' },
                                    { id: '50000', label: '제주' },
                                ].map((reg) => (
                                    <button
                                        key={reg.id}
                                        onClick={() => toggleYouthRegion(reg.id)}
                                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all duration-200
                                            ${youthRegions.includes(reg.id) 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200 hover:text-blue-500'}`}
                                    >
                                        {reg.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search Button */}
                            <button
                                onClick={() => loadApiData('YOUTH')}
                                className="absolute right-4 bottom-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95"
                            >
                                <Search size={18} />
                                검색하기
                            </button>
                        </div>
                    </div>
                )}

                <div 
                    key={activeApiTab} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
                >
                    {((activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => {
                            const term = (apiSearchTerm || clientFilter || '').toLowerCase();
                            if (!term) return true;
                            
                            const name = String(api?.servNm || '').toLowerCase();
                            const dgst = String(api?.servDgst || '').toLowerCase();
                            const keywords = Array.isArray(api?.keywords) ? api.keywords.map(k => String(k).toLowerCase()) : [];
                            
                            if (keywords.includes(term)) return true;
                            const matchesText = name.includes(term) || dgst.includes(term);
                            const date = String(api?.svcfrstRegTs || '');
                            const isLatest = date.includes('2026') || date.includes('2025');
                            
                            return matchesText || (isLatest && (name.includes('보육') || name.includes('청년') || name.includes('지원')));
                        })
                    ).length === 0 ? (
                        <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                            {isFetchingApi || isFetchingLocal ? '데이터를 불러오는 중입니다...' : '검색된 항목이 없습니다.'}
                        </div>
                    ) : (
                        (activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => {
                            const term = (apiSearchTerm || clientFilter || '').toLowerCase();
                            if (!term) return true;
                            
                            const name = String(api?.servNm || '').toLowerCase();
                            const dgst = String(api?.servDgst || '').toLowerCase();
                            const keywords = Array.isArray(api?.keywords) ? api.keywords.map(k => String(k).toLowerCase()) : [];
                            
                            if (keywords.includes(term)) return true;
                            const matchesText = name.includes(term) || dgst.includes(dgst);
                            const date = String(api?.svcfrstRegTs || '');
                            const isLatest = date.includes('2026') || date.includes('2025');
                            
                            return matchesText || (isLatest && (name.includes('보육') || name.includes('청년') || name.includes('지원')));
                        })
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
                                                    title="변 기자 프롬프트 복사"
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

            {/* Article Advanced Search Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-900 p-2 rounded-lg text-white">
                        <Filter size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">상세 검색</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* 분류 선택 */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">기사 분류 (대분류)</label>
                        <select 
                            value={searchFilters.mainCategory}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, mainCategory: e.target.value }))}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                            <option value="전체">전체 대분류</option>
                            {mainCategories.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">기사 분류 (소분류)</label>
                        <select 
                            value={searchFilters.subCategory}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, subCategory: e.target.value }))}
                            disabled={searchFilters.mainCategory === '전체'}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
                        >
                            <option value="전체">전체 소분류</option>
                            {subCategories.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">게시 상태</label>
                        <select 
                            value={searchFilters.status}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                            <option value="전체">전체 상태</option>
                            <option value="게시중">게시중</option>
                            <option value="미게재">미게재</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {/* 날짜 필터 */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">날짜 구분</label>
                        <select 
                            value={searchFilters.dateType}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, dateType: e.target.value }))}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                            <option value="created">게재일 기준</option>
                            <option value="updated">수정일 기준</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">시작일</label>
                        <input 
                            type="date"
                            value={searchFilters.startDate}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">종료일</label>
                        <input 
                            type="date"
                            value={searchFilters.endDate}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">검사어</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="제목 또는 내용..."
                                value={searchFilters.keyword}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                    <button 
                        onClick={handleReset}
                        className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all font-bold"
                    >
                        <RotateCcw size={18} />
                        초기화
                    </button>
                    <button 
                        onClick={handleSearch}
                        className="bg-gray-900 text-white px-10 py-3 rounded-xl flex items-center gap-2 hover:bg-black transition-all font-bold shadow-lg shadow-gray-200"
                    >
                        <Search size={18} />
                        기사 검색하기
                    </button>
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
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {item.category_list && item.category_list.length > 0 ? (
                                                item.category_list.map((cat, idx) => (
                                                    <span key={idx} className="bg-blue-100 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {cat.category}{cat.prefix && cat.prefix !== '전체' ? ` > ${cat.prefix}` : ''}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="bg-blue-100 text-primary px-2 py-1 rounded text-[11px] font-bold">{item.category}</span>
                                            )}
                                        </div>
                                    </td>
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
