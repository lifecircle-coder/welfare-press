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
                const dateA = String(a.svcfrstRegTs || '');
                const dateB = String(b.svcfrstRegTs || '');
                return dateB.localeCompare(dateA);
            });

            setApiData(list.slice(0, 100)); // Increase limit for better search/filter
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

            if (api.apiSource === 'MCST_PRESS' || api.apiSource === 'MCST_NEWS') {
                prompt = `[왕기자 기사 작성용 소스 - 보도자료/뉴스]
아래 대한민국 정책브리핑에서 수집된 최신 보도자료를 바탕으로, 국민들에게 신선하고 유익한 뉴스 브리핑 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 출처: ${api.jurMnofNm} (${api.apiSource === 'MCST_PRESS' ? '보도자료' : '정책뉴스'})
* 제목: ${api.servNm}
* 요약: ${api.servDgst}
* 상세 링크: ${api.servDtlLink}
* 등록일: ${api.svcfrstRegTs}

--- [작성 가이드] ---
왕 기자, 이 보도자료는 **'신속함'**과 **'정확성'**이 생명이야!

1. 기사 제목: 독자의 눈길을 사로잡는 뉴스 헤드라인 (부제목 포함 가능)
2. 요약본: 이 소식의 핵심 내용을 1~2줄로 요약
3. 본문 내용: 팩트 중심으로 6하원칙에 따라 정리. 정부 부처의 발표 내용을 국민의 시각에서 풀어서 설명해주세요. **(중요) 승인된 정보만 쓰세요.**
4. 해시태그: 5~10개 (다양하게 제안)
5. 썸네일 이미지: 뉴스 분위기의 실사형 이미지 제작 (한국인 모델/한국 배경)
6. 표기 유의 사항: 기호 자제, 신뢰감 있는 문체 사용.
`;
            } else if (api.apiSource === 'MCST_PHOTO') {
                prompt = `[왕기자 기사 작성용 소스 - 정책포토]
아래 정책 현장의 생생한 사진과 정보를 바탕으로, 현장감 넘치는 포토 뉴스 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 제목: ${api.servNm}
* 사진 링크: ${api.thumbnail}
* 원문 링크: ${api.servDtlLink}

--- [작성 가이드] ---
왕 기자, 이 기사는 **'생동감'**이 중요해! 사진 속의 현장을 묘사하며 기사를 써줘.

1. 기사 제목: 현장의 분위기를 전달하는 감성적인 제목
2. 요약본: 사진이 담고 있는 의미 1줄 요약
3. 본문 내용: 정책 현장의 모습을 생생하게 묘사하고, 관련된 정책의 취지를 설명.
4. 해시태그: 3~5개
5. 썸네일 이미지: 사진 소스 자체가 썸네일이 될 수 있도록 구성 제안.
`;
            } else if (api.apiSource === 'MOIS_STATS') {
                prompt = `[왕기자 기사 작성용 소스 - 통계자료]
공공데이터 portal에서 수집된 보조금24 이용 통계 데이터를 바탕으로, 숫자로 보는 정책 성과 기사를 작성해주세요.

--- [수집된 원본 데이터] ---
* 제목: ${api.servNm}
* 통계 내용: ${api.servDgst}
* 기준일: ${api.svcfrstRegTs}

--- [작성 가이드] ---
왕 기자, 숫자는 거짓말을 안 해! **'데이터'**를 기반으로 성과를 증명해줘.

1. 기사 제목: 주요 수치를 강조한 임팩트 있는 제목 (예: "국민 OOO명 돌파!")
2. 요약본: 통계가 시사하는 바를 명확히 요약
3. 본문 내용: 통계 수치를 비교/분석하여 정책의 효과성을 강조. 독자들이 자부심을 느낄 수 있도록 작성.
4. 인포그래픽 제안: 본문에 넣을 만한 간단한 데이터 도표나 그래프 컨셉 제안 포함.
5. 해시태그: 4~6개
`;
            } else if (api.apiSource === 'LOCAL') {
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
6. 표기 유의 사항: AI 티가 나지 않도록 자연스�                {/* 상단 툴바: 소스 대분류 및 검색 */}
                <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-blue-600" />
                        <select
                            className="border-none bg-transparent font-bold text-sm text-gray-700 focus:ring-0 cursor-pointer outline-none"
                            value={activeApiTab}
                            onChange={(e) => setActiveApiTab(e.target.value as any)}
                        >
                            <optgroup label="🔥 실시간 뉴스">
                                <option value="MCST_PRESS">🗞️ 정책브리핑 (보도자료)</option>
                                <option value="MCST_NEWS">📰 정책브리핑 (뉴스)</option>
                                <option value="MCST_PHOTO">📸 정책브리핑 (포토)</option>
                                <option value="NEWS_ALL">✨ 통합 뉴스 브리핑</option>
                            </optgroup>
                            <optgroup label="📋 정책 및 정보">
                                <option value="NATIONAL">🏢 전국 통합 (복지로)</option>
                                <option value="MOGEF">👩 여성가족부</option>
                                <option value="SUBSIDY">💰 보조금24 (행안부)</option>
                                <option value="LOCAL">📍 지자체 특화</option>
                                <option value="MOIS_STATS">📊 보조금24 통계</option>
                            </optgroup>
                        </select>
                    </div>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 focus-within:border-blue-300 transition-all">
                        <Search size={14} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="소스 내 키워드 검색..."
                            className="bg-transparent border-none outline-none text-xs w-full"
                            value={apiSearchTerm}
                            onChange={(e) => setApiSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {((activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.includes(apiSearchTerm) || api.servDgst.includes(apiSearchTerm))
                    ).length === 0 ? (
                        <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                            {(isFetchingApi || isFetchingLocal) ? '데이터를 불러오는 중입니다...' : '검색된 목록이 없습니다.'}
                        </div>
                    ) : (
                        (activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.includes(apiSearchTerm) || api.servDgst.includes(apiSearchTerm))
                        .map(api => {
                            const isCopied = !!copiedState[api.servId];
                            
                            // D-Day / 시간 계산
                            const getRelativeTime = (ds?: string) => {
                                if (!ds) return '';
                                const raw = String(ds);
                                const year = parseInt(raw.substring(0, 4));
                                const month = parseInt(raw.substring(4, 6)) - 1;
                                const day = parseInt(raw.substring(6, 8));
                                const date = new Date(year, month, day);
                                const now = new Date();
                                const diff = now.getTime() - date.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                
                                if (days === 0) return '오늘';
                                if (days === 1) return '어제';
                                return `${days}일 전`;
                            };

                            const isNew = getRelativeTime(api.svcfrstRegTs) === '오늘' || getRelativeTime(api.svcfrstRegTs) === '어제';

                            // 키워드 추출 (간단 모의 로직 - 추후 AI 연동 가능)
                            const keywords = api.keywords || 
                                api.servNm.split(' ').filter(w => w.length > 1).slice(0, 3);

                            const sourceLabels: any = {
                                'MCST_PRESS': { label: '보도자료', color: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
                                'MCST_NEWS': { label: '정책뉴스', color: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50' },
                                'MCST_PHOTO': { label: '뉴스포토', color: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50' },
                                'NATIONAL': { label: '복지로', color: 'bg-sky-600', text: 'text-sky-700', bg: 'bg-sky-50' },
                                'LOCAL': { label: '지자체', color: 'bg-orange-600', text: 'text-orange-700', bg: 'bg-orange-50' },
                                'SUBSIDY': { label: '보조금24', color: 'bg-green-600', text: 'text-green-700', bg: 'bg-green-50' },
                                'YOUTH': { label: '청년정책', color: 'bg-violet-600', text: 'text-violet-700', bg: 'bg-violet-50' },
                                'MOGEF': { label: '여가부', color: 'bg-pink-600', text: 'text-pink-700', bg: 'bg-pink-50' },
                                'MOIS_STATS': { label: '통계', color: 'bg-gray-600', text: 'text-gray-700', bg: 'bg-gray-50' }
                            };

                            const s = sourceLabels[api.apiSource || 'NATIONAL'];

                            return (
                                <div key={api.servId} className={`bg-white p-4 rounded-xl border flex gap-4 shadow-sm hover:shadow-md transition-all group ${isCopied ? 'opacity-60 grayscale-[0.5]' : 'border-gray-100 hover:border-blue-300'}`}>
                                    {/* Thumbnail if exists */}
                                    {(api.thumbnail || api.apiSource === 'MCST_PHOTO') && (
                                        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                                            <img src={api.thumbnail || '/assets/images/placeholder.png'} alt="thumbnail" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            {isNew && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">NEW</span>}
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
                                                {s.label}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">{api.jurMnofNm}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-[10px] text-blue-500 font-bold">{getRelativeTime(api.svcfrstRegTs)}</span>
                                        </div>
                                        
                                        <h4 
                                            className="font-bold text-base text-gray-900 mb-1 truncate cursor-pointer hover:text-blue-600"
                                            onClick={() => setSelectedApiItem(api)}
                                        >
                                            {api.servNm}
                                        </h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{api.servDgst}</p>
                                        
                                        <div className="flex flex-wrap gap-1.5">
                                            {keywords.map((kw, i) => (
                                                <span key={i} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                    #{kw.replace(/[\[\]]/g, '')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 justify-center">
                                        <button
                                            onClick={() => !isCopied && handleCopySource(api)}
                                            disabled={isCopied}
                                            className={`flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-lg transition-all font-bold shadow-sm ${isCopied ? 'bg-gray-100 text-gray-400 border border-gray-200' : `${s.color} text-white hover:scale-105 active:scale-95`}`}
                                        >
                                            {isCopied ? '복사됨' : <><Copy size={14} /> 소스 복사</>}
                                        </button>
                                        <button 
                                            onClick={() => setSelectedApiItem(api)}
                                            className="text-[11px] text-gray-500 hover:text-blue-600 font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors"
                                        >
                                            상세보기
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
p-8 text-center text-blue-800 font-bold animate-pulse bg-white rounded-lg border border-blue-100">
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
