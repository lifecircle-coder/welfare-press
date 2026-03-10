'use client';

import { Plus, Search, Filter, Copy, Calendar, User, Trash2, MapPin, MessageCircle, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllArticles, deleteArticle, getComments, addComment, getArticlesWithNewComments } from '@/lib/services';
import type { Article, Comment } from '@/lib/services';
import { useRouter } from 'next/navigation';
import { getNationalWelfareList, getSubsidy24List, getYouthPolicyList, getMogefNewsList, getNationalWelfareDetail, getLocalGovWelfareList, getLocalGovWelfareDetail, WelfareService } from '@/lib/api/publicData';
import { adminSupabase } from '@/lib/supabaseClient';

export default function ArticleManagement() {
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('전체');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [newCommentArticleIds, setNewCommentArticleIds] = useState<string[]>([]);

    // Public Data State
    const [activeApiTab, setActiveApiTab] = useState<'NATIONAL' | 'LOCAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF'>('NATIONAL');

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
        const data = await getAllArticles(100);

        // 최근 12시간 이내 새 댓글이 달린 기사 ID 조회
        const newComments = await getArticlesWithNewComments(12);
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

    const loadApiData = async (tab: 'NATIONAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF') => {
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
            }

            list.sort((a, b) => {
                const dateA = String(a.svcfrstRegTs || '');
                const dateB = String(b.svcfrstRegTs || '');
                return dateB.localeCompare(dateA);
            });

            setApiData(list.slice(0, 50));
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
        if (confirm('정말 삭제하시겠습니까?')) {
            await deleteArticle(id);
            loadArticles();
        }
    };

    const handleOpenCommentModal = async (article: Article) => {
        setSelectedArticle(article);
        setIsCommentModalOpen(true);
        const comments = await getComments(article.id);
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

        await addComment(comment);
        const updated = await getComments(selectedArticle.id);
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

            if (api.apiSource === 'LOCAL') {
                const detail = await getLocalGovWelfareDetail(api.servId);
                prompt = `[왕기자 기사 작성용 소스]
아래 공공데이터포털(한국사회보장정보원)에서 수집된 지자체 특화 복지 정책 데이터를 바탕으로, 해당 지역 주민들이 이해하기 쉽고 친절한 안내 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 지자체명: ${api.jurMnofNm}
* 정책명: ${api.servNm}
* 정책 요약: ${api.servDgst}
* 지원 대상: ${detail?.trgterIndvdlArray || '상세 정보 참조'}
* 선정 기준: ${detail?.slctCritCn || '상세 정보 참조'}
* 상세 혜택: ${detail?.alwServCn || '상세 정보 참조'}
* 업데이트일: ${detail?.svcfrstRegTs || '미상'}

--- [작성 가이드] ---
1. 기사 제목: 핵심 혜택과 지자체명(${api.jurMnofNm})을 직관적으로 알 수 있는 매력적인 제목
2. 요약본: 1~2줄의 핵심 요약
3. 카테고리/말머리 제안: (예: 카테고리-일자리•취업, 말머리-창업)
**카테고리별 말머리
**1) 건강•의료 : 건강, 의료, 보험, 운동
**2) 임신•육아 : 임신, 육아, 보육, 지원
**3) 일자리•취업 : 일자리, 취업, 창업, 교육
**4) 생활•안전 : 생활, 안전, 교통, 환경
**5) 주거•금융 : 주거, 금융, 청약, 대출
4. 본문 내용: '지원 대상', '선정 기준', '지원 내용' 등을 가독성 있게 작성하되 실제 주민들에게 와닿는 혜택 위주로 정리해주세요. **(중요) 없는 내용을 지어내지 마세요.**
5. 지역 특화 연출: 기사 서두에 해당 지역 주민들에게 반가운 소식임을 강조
6. 해시태그 : 기사에 부합되는 해시태그 3~7개 작성
7. 썸네일 이미지 : 기사에 부합되는 실사 스타일의 가로형 한국 배경 이미지 제작 (외국인 제외)
8. 표기 유의 사항 : AI스러운 기호(:, **) 사용을 자제하고 자연스럽게 작성.
`;
            } else if (api.apiSource === 'MOGEF') {
                prompt = `[왕기자 기사 작성용 소스]
아래 공공데이터포털에서 수집된 신규 여성가족부 정책(뉴스) 데이터를 바탕으로, 국민들이 이해하기 쉽고 친절한 안내 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 기관명: ${api.jurMnofNm}
* 정책 뉴스 제목: ${api.servNm}
* 등록일: ${api.svcfrstRegTs || '미상'}
* 상세 링크: ${api.servDtlLink || '미상'}

--- [작성 가이드] ---
왕 기자, 이 소스에 있는 '상세 링크'의 본문 내용을 읽고 아래 지시사항대로 기사를 써와!

1. 기사 제목: 정책의 핵심을 직관적으로 보여주는 매력적인 제목
2. 요약본: 1~2줄의 핵심 요약
3. 본문 내용: 뉴스 브리핑 포맷으로 가독성 있게 작성. 국민들이 얻을 수 있는 혜택이나 변화된 점을 강조. **(중요) 팩트에 기반해 작성하세요.**
4. 해시태그: 3~7개 제안
5. 썸네일 이미지: 한국적인 느낌의 실사 혹은 깔끔한 일러스트 이미지 제작
6. 표기 유의 사항: 특수문자(:, **) 사용 자제, 자연스러운 구어체 사용.
`;
            } else if (api.apiSource === 'SUBSIDY' || api.apiSource === 'YOUTH') {
                prompt = `[왕기자 기사 작성용 소스]
아래 공공데이터포털에서 수집된 ${api.apiSource === 'SUBSIDY' ? '보조금24' : '청년정책'} 데이터를 바탕으로, 국민의 수혜 중심 안내 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 출처: ${api.apiSource === 'SUBSIDY' ? '행정안전부(보조금24)' : '온라인청년센터(청년정책)'}
* 정책명: ${api.servNm}
* 주요 내용: ${api.servDgst}
* 소관기관: ${api.jurMnofNm}
* 업데이트일: ${api.svcfrstRegTs || '미상'}

--- [작성 가이드] ---
왕 기자, 이 기사의 핵심은 **'독자가 놓치고 있는 혜택'**을 짚어주는 거야!

1. 기사 제목: 금액이나 구체적 혜택을 강조한 파격적인 제목
2. 요약본: 1~2줄의 핵심 요약 (이 기사를 읽고 무엇을 신청해야 하는지)
3. 본문 내용: '대상', '혜택', '방법'을 중심으로 친절하게 설명. 옆집 이웃에게 알려주듯 작성. **(중요) 사실 기반 작성.**
4. 해시태그: 3~7개 제안
5. 썸네일 이미지: 혜택의 느낌이 살아있는 실사 스타일 이미지 제작 (한국인 모델)
6. 표기 유의 사항: 자연스러운 문장 사용, 특수 기호 자제.
`;
            } else {
                const detail = await getNationalWelfareDetail(api.servId);
                prompt = `[왕기자 기사 작성용 소스]
아래 공공데이터포털에서 수집된 신규 복지 정책 데이터를 바탕으로, 국민들이 이해하기 쉽고 친절한 안내 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 기관명: ${api.jurMnofNm}
* 정책명: ${api.servNm}
* 정책 요약: ${api.servDgst || '상세 내용 참조'}
* 지원 대상: ${detail?.trgterIndvdlArray || '상세 정보 참조'}
* 선정 기준: ${detail?.slctCritCn || '상세 정보 참조'}
* 상세 혜택: ${detail?.alwServCn || '상세 정보 참조'}
* 등록일: ${api.svcfrstRegTs || '미상'}

--- [작성 가이드] ---
1. 기사 제목: 핵심 혜택과 대상을 직관적으로 알 수 있는 매력적인 제목
2. 요약본: 1~2줄의 핵심 요약
3. 본문 내용: '누가', '어떻게', '무엇을' 받는지 가독성 있게 정리. **(중요) 팩트체크 필수.**
4. 해시태그: 3~7개 제안
5. 썸네일 이미지: 기사에 어울리는 따뜻한 분위기의 실사 이미지 제작 (한국 배경)
6. 표기 유의 사항: AI 티가 나지 않도록 자연스러운 어휘 사용.
`;
            }

            await navigator.clipboard.writeText(prompt);
            const newCopiedState = { ...copiedState, [api.servId]: Date.now() };
            setCopiedState(newCopiedState);
            localStorage.setItem('copiedPublicData', JSON.stringify(newCopiedState));
            alert('기사 작성용 소스가 복사되었습니다. 왕기자에게 전달하세요!');
        } catch (error) {
            console.error(error);
            alert('소스 복사 중 오류가 발생했습니다.');
        }
    };

    const handleHidePublicData = (servId: string) => {
        const newDeletedState = { ...deletedState, [servId]: true };
        setDeletedState(newDeletedState);
        localStorage.setItem('deletedPublicData', JSON.stringify(newDeletedState));
    };

    const filterApiData = (sourceArray: WelfareService[]) => {
        return sourceArray.filter(api => {
            if (deletedState[api.servId]) return false;
            const copyTime = copiedState[api.servId];
            if (copyTime && Date.now() - copyTime >= 24 * 60 * 60 * 1000) return false;
            return true;
        });
    };

    const displayApiData = filterApiData(apiData);
    const displayLocalApiData = filterApiData(localApiData);

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.includes(searchTerm) || article.content?.includes(searchTerm);
        const matchesCategory = filterCategory === '전체' || article.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">기사 관리</h2>
                <Link
                    href="/admin/articles/write"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    기사 작성
                </Link>
            </div>

            {/* Public Data API Source List */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 shadow-sm">
                <div className="flex flex-col mb-4 gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs tracking-wider">NEW</span>
                            공공데이터 포털 소스 검색
                        </h3>
                        <button
                            onClick={() => activeApiTab === 'LOCAL' ? loadLocalApiData() : loadApiData(activeApiTab)}
                            disabled={activeApiTab === 'LOCAL' ? isFetchingLocal : isFetchingApi}
                            className="text-sm text-blue-600 hover:text-blue-800 font-bold underline"
                        >
                            {(activeApiTab === 'LOCAL' ? isFetchingLocal : isFetchingApi) ? '동기화 중...' : '수동 동기화'}
                        </button>
                    </div>

                    {/* 도움말 박스 */}
                    <div className="bg-blue-100/50 border border-blue-200 p-3 rounded-lg text-[13px] text-blue-800 leading-relaxed shadow-inner">
                        <p className="font-bold mb-1 flex items-center gap-1.5 text-blue-900"><Search size={14} /> 어떻게 사용하나요?</p>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                            <li>하단의 탭(여성가족부, 보조금24 등)을 선택해 최신 정책 정보를 찾으세요.</li>
                            <li>기사화하고 싶은 항목의 <strong>[소스 복사]</strong> 버튼을 누르세요.</li>
                            <li>복사된 내용을 <strong>왕 기자</strong>(기사 작성 페이지)에게 전달하면 기사가 완성됩니다.</li>
                        </ul>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-blue-200 overflow-x-auto no-scrollbar mb-4 gap-1">
                    {[
                        { id: 'NATIONAL', label: '전국 통합 (복지로)', color: 'blue' },
                        { id: 'MOGEF', label: '여성가족부', color: 'pink' },
                        { id: 'SUBSIDY', label: '보조금24 (행안부)', color: 'green' },
                        { id: 'YOUTH', label: '청년정책', color: 'purple' },
                        { id: 'LOCAL', label: '지자체 특화', color: 'orange' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveApiTab(tab.id as any)}
                            className={`py-2 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${activeApiTab === tab.id
                                ? `border-${tab.color}-600 text-${tab.color}-700`
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeApiTab === 'LOCAL' ? (
                        /* LOCAL Tab Rendering */
                        isFetchingLocal ? (
                            <div className="p-8 text-center text-orange-600 font-bold animate-pulse bg-white rounded-lg border border-orange-100">
                                지자체 맞춤형 복지 정책을 수집하고 있습니다...
                            </div>
                        ) : localApiData.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                                수집된 지자체 목록이 없습니다.
                            </div>
                        ) : (
                            displayLocalApiData.map(api => {
                                const isCopied = !!copiedState[api.servId];
                                return (
                                    <div key={api.servId} className="bg-white p-4 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm hover:border-orange-400 hover:shadow transition-all group">
                                        <div className="flex-1 pr-6">
                                            <div className="text-xs text-orange-600 font-bold mb-1 flex items-center gap-2">
                                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                                                    <MapPin size={10} /> 지자체API
                                                </span>
                                                {api.jurMnofNm}
                                                <span className="text-gray-400 font-normal">|</span>
                                                <span className="text-gray-500 font-normal text-[11px]">{api.servId}</span>
                                            </div>
                                            <div className={`font-bold text-lg mb-1 leading-tight ${isCopied ? 'text-gray-400' : 'text-gray-900'}`}>{api.servNm}</div>
                                            <div className={`text-sm line-clamp-1 ${isCopied ? 'text-gray-400' : 'text-gray-600'}`}>{api.servDgst}</div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => !isCopied && handleCopySource(api)}
                                                disabled={isCopied}
                                                className={`flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors font-bold shadow-sm ${isCopied ? 'bg-gray-100 text-gray-400' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                                            >
                                                {isCopied ? '복사 완료' : <><Copy size={16} /> 상세복사</>}
                                            </button>
                                            <button onClick={() => handleHidePublicData(api.servId)} className="text-gray-400 hover:text-red-500 bg-white px-3 py-2 rounded-lg border border-gray-200"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                )
                            })
                        )
                    ) : (
                        /* Other Tabs (NATIONAL, MOGEF, SUBSIDY, YOUTH) */
                        isFetchingApi ? (
                            <div className="p-8 text-center text-blue-800 font-bold animate-pulse bg-white rounded-lg border border-blue-100">
                                데이터를 불러오는 중입니다...
                            </div>
                        ) : apiData.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                                검색된 목록이 없습니다.
                            </div>
                        ) : (
                            displayApiData.map(api => {
                                const isCopied = !!copiedState[api.servId];
                                const formatRegDate = (ds?: string | number) => {
                                    const raw = String(ds || '');
                                    if (raw.length !== 8) return '';
                                    return `${raw.substring(0, 4)}.${raw.substring(4, 6)}.${raw.substring(6, 8)}`;
                                };
                                const sourceColors: any = {
                                    'SUBSIDY': 'bg-green-600 hover:bg-green-700',
                                    'YOUTH': 'bg-purple-600 hover:bg-purple-700',
                                    'MOGEF': 'bg-pink-600 hover:bg-pink-700',
                                    'NATIONAL': 'bg-blue-600 hover:bg-blue-700'
                                };
                                return (
                                    <div key={api.servId} className="bg-white p-4 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm hover:border-blue-400 hover:shadow transition-all group">
                                        <div className="flex-1 pr-6">
                                            <div className="text-xs text-blue-600 font-bold mb-1 flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${api.apiSource === 'SUBSIDY' ? 'bg-green-100 text-green-700' :
                                                    api.apiSource === 'YOUTH' ? 'bg-purple-100 text-purple-700' :
                                                        api.apiSource === 'MOGEF' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>{api.apiSource || '보건복지부'}</span>
                                                {api.jurMnofNm}
                                                <span className="text-gray-400 font-normal">|</span>
                                                <span className="text-gray-500 font-normal flex items-center gap-1"><Calendar size={12} /> {api.svcfrstRegTs ? formatRegDate(api.svcfrstRegTs) : '최근'}</span>
                                            </div>
                                            <div className={`font-bold text-lg mb-1 leading-tight ${isCopied ? 'text-gray-400' : 'text-gray-900'}`}>{api.servNm}</div>
                                            <div className={`text-sm line-clamp-1 ${isCopied ? 'text-gray-400' : 'text-gray-600'}`}>{api.servDgst}</div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => !isCopied && handleCopySource(api)}
                                                disabled={isCopied}
                                                className={`flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors font-bold shadow-sm ${isCopied ? 'bg-gray-100 text-gray-400' : `${sourceColors[api.apiSource || 'NATIONAL']} text-white`
                                                    }`}
                                            >
                                                {isCopied ? '복사 완료' : <><Copy size={16} /> 소스 복사</>}
                                            </button>
                                            <button onClick={() => handleHidePublicData(api.servId)} className="text-gray-400 hover:text-red-500 bg-white px-3 py-2 rounded-lg border border-gray-200"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                )
                            })
                        )
                    )}
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-primary min-w-[200px]">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="제목, 내용 검색"
                        className="outline-none text-sm w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 bg-white outline-none"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="전체">전체 카테고리</option>
                    <option value="일자리·취업">일자리·취업</option>
                    <option value="주거·금융">주거·금융</option>
                    <option value="건강·의료">건강·의료</option>
                    <option value="생활·안전">생활·안전</option>
                    <option value="임신·육아">임신·육아</option>
                </select>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 bg-white">
                    <Calendar size={16} /> 기간 설정
                </div>
            </div>

            {/* Article List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium">제목</th>
                            <th className="p-4 font-medium">작성자</th>
                            <th className="p-4 font-medium">분류</th>
                            <th className="p-4 font-medium">상태</th>
                            <th className="p-4 font-medium">발행일 (created_at)</th>
                            <th className="p-4 font-medium">수정일 (updated_at)</th>
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {item.status === 'published' ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            게시중
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-bold">
                                            미게시 (임시저장)
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-xs font-medium text-gray-600">
                                    {item.created_at ? new Date(item.created_at).toLocaleString('ko-KR', {
                                        timeZone: 'Asia/Seoul',
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    }) : (item.date ? new Date(item.date).toLocaleString('ko-KR', {
                                        timeZone: 'Asia/Seoul',
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    }) : '-')}
                                </td>
                                <td className="p-4 text-xs font-medium text-blue-600">
                                    {item.updated_at ? new Date(item.updated_at).toLocaleString('ko-KR', {
                                        timeZone: 'Asia/Seoul',
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    }) : '-'}
                                </td>
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenCommentModal(item)}
                                            className="relative flex items-center gap-1 text-primary hover:text-blue-700 border border-blue-100 px-2 py-1 rounded bg-blue-50/50 font-bold whitespace-nowrap"
                                        >
                                            {newCommentArticleIds.includes(item.id) && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                            )}
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

            {/* Comment Management Modal */}
            {isCommentModalOpen && selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 truncate max-w-md">{selectedArticle.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">기사 댓글 관리 ({modalComments.length})</p>
                            </div>
                            <button onClick={() => setIsCommentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                            {modalComments.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">등록된 댓글이 없습니다. 독자와 소통을 시작해보세요!</div>
                            ) : (
                                modalComments.filter(c => !c.parentId).map(comment => (
                                    <div key={comment.id} className="space-y-3">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-sm">{comment.author}</span>
                                                    <span className="text-[10px] text-gray-400">{comment.date}</span>
                                                </div>
                                                <button
                                                    onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                                                    className="text-[11px] font-bold text-primary hover:underline"
                                                >
                                                    답글달기
                                                </button>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                                        </div>

                                        {/* Nested Replies */}
                                        <div className="ml-8 space-y-3 border-l-2 border-gray-100 pl-4">
                                            {modalComments.filter(c => c.parentId === comment.id).map(reply => (
                                                <div key={reply.id} className="bg-blue-50/30 p-3 rounded-lg border border-blue-50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-900 text-[13px]">{reply.author}</span>
                                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold">작성자</span>
                                                        <span className="text-[10px] text-gray-400">{reply.date}</span>
                                                    </div>
                                                    <p className="text-gray-700 text-[13px] leading-relaxed">{reply.content}</p>
                                                </div>
                                            ))}

                                            {/* Reply Input for this parent */}
                                            {replyingToId === comment.id && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={adminReplyContent}
                                                        onChange={(e) => setAdminReplyContent(e.target.value)}
                                                        placeholder="답글 내용을 입력하세요..."
                                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                        onKeyDown={(e) => e.key === 'Enter' && handlePostAdminComment(comment.id)}
                                                    />
                                                    <button
                                                        onClick={() => handlePostAdminComment(comment.id)}
                                                        className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer (Main Input) */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newAdminComment}
                                        onChange={(e) => setNewAdminComment(e.target.value)}
                                        placeholder="새 댓글을 작성하세요... (기자/관리자 명의)"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                                    />
                                    <div className="absolute bottom-2 left-4 text-[10px] text-gray-400 font-medium">
                                        작성자: <span className="text-primary font-bold">{currentUser?.name || '관리자'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePostAdminComment()}
                                    className="px-6 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-500/20"
                                >
                                    <Send size={20} />
                                    <span className="text-xs">등록</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
