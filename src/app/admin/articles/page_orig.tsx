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
    const [filterCategory, setFilterCategory] = useState('?꾩껜');
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

        // 理쒓렐 12?쒓컙 ?대궡 ???볤????щ┛ 湲곗궗 ID 議고쉶
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
                // ?곗꽑?쒖쐞 媛以묒튂 ?뺣젹 (1: 蹂대룄?먮즺, 2: ?뺤콉?댁뒪/?쇰컲, 3: 蹂듭??뺣낫, ...)
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
        if (confirm('?뺣쭚濡???젣?섏떆寃좎뒿?덇퉴?')) {
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
            const sourceName = api.jurMnofNm || '?뺣? 遺泥?;
            const title = api.servNm;
            const summary = api.servDgst;
            const link = api.servDtlLink || '?곸꽭 ?섏씠吏 李몄“';
            const keywords = (api.keywords || []).join(', ');

            // ??湲곗옄(AI Persona) ?꾩슜 吏?ν삎 ?꾨＼?꾪듃 ?쒗뵆由?            if (api.apiSource === 'MCST_PRESS') {
                prompt = `[??湲곗옄 ?꾩슜: 蹂대룄?먮즺 湲곕컲 湲곗궗 ?묒꽦 吏移?

?듭떖 ?뚯뒪: 臾명솕泥댁쑁愿愿묐? 蹂대룄?먮즺
湲곌?紐? ${sourceName}
湲곗궗 ?쒕ぉ ?꾨낫: ${title}
?곗씠???붿빟: ${summary}
?곸꽭 URL: ${link}
?ㅼ썙?? ${keywords}

?묒꽦 吏移?
1. 蹂대룄?먮즺???⑺듃瑜?湲곕컲?쇰줈 媛앷??곸씠怨??좊ː媛??덈뒗 ?좊Ц???ㅼ븻留ㅻ꼫瑜??좎??섏꽭??
2. ?낆옄媛 ?쒗깮???쎄쾶 ?댄빐?????덈룄濡?'Q&A' ?먮뒗 '?듭떖 ?붿빟 3媛吏' ?뱀뀡???ы븿?섏꽭??
3. ?꾨Ц ?⑹뼱???쎄쾶 ??댁꽌 ?ㅻ챸?섍퀬, ?쒗뻾 ?쇱떆? ?μ냼瑜?紐낇솗??媛뺤“??二쇱꽭??`;
            } else if (api.apiSource === 'MCST_NEWS' || api.apiSource === 'MCST_PHOTO') {
                prompt = `[??湲곗옄 ?꾩슜: ?뺤콉 ?댁뒪 湲곕컲 湲곗궗 ?묒꽦 吏移?

?댁뒪 ?뚯뒪: ??쒕?援??뺤콉?댁뒪
?쒕ぉ: ${title}
?댁슜 ?붿빟: ${summary}
李멸퀬 URL: ${link}

?묒꽦 吏移?
1. 理쒖떊 ?몃젋?쒖? ?곌껐?섏뿬 ?낆옄?ㅼ쓽 愿?ъ쓣 ?????덈뒗 ?λ?濡쒖슫 ?ㅻ뱶?쇱씤??戮묒븘二쇱꽭??
2. ?뺤콉???곕━ ?띠뿉 誘몄튂???곹뼢??以묒떖?쇰줈 '移쒓렐???댁꽕' ?ㅼ쑝濡??묒꽦?섏꽭??
3. ?뺤콉 愿???볤??대굹 ?뚯뀥 誘몃뵒?댁쓽 諛섏쓳???덉긽?섏뿬 蹂댁셿?섎뒗 ?댁슜??異붽???二쇱꽭??`;
            } else if (api.apiSource === 'NATIONAL' || api.apiSource === 'LOCAL' || api.apiSource === 'SUBSIDY') {
                prompt = `[??湲곗옄 ?꾩슜: 蹂듭?/?쒗깮 ?덈궡 湲곗궗 ?묒꽦 吏移?

吏???뺤콉紐? ${title}
?뚭? 湲곌?: ${sourceName}
二쇱슂 ?댁슜: ${summary}
?좎껌 諛⑸쾿/留곹겕: ${link}

?묒꽦 吏移?
1. '?좎껌 ???섎㈃ ?먰빐!'?쇰뒗 ?먮굦???ㅼ깮??泥닿컧??蹂듭? ?덈궡 湲곗궗濡??묒꽦?섏꽭??
2. ?좎껌 ?먭꺽, 吏??湲덉븸, ?좎껌 諛⑸쾿??釉붾젢 ?ъ씤?몃줈 ?좊챸?섍쾶 ?뺣━??二쇱꽭??
3. 鍮꾩듂???ㅻⅨ 蹂듭? ?쒕룄? 鍮꾧탳?섏뿬 ?대뼡 ?먯씠 醫뗭?吏 ?멸툒??二쇰㈃ 醫뗭뒿?덈떎.`;
            } else {
                prompt = `[??湲곗옄 ?꾩슜: ?쇰컲 ?뺣낫 釉뚮━??吏移?

?쒕ぉ: ${title}
?댁슜: ${summary}
異쒖쿂: ${sourceName}

?묒꽦 吏移?
1. ???뺣낫瑜??좊?濡??낆옄?ㅼ뿉寃??좎씡???뺣낫??釉붾줈洹??댁뒪 湲곗궗瑜??묒꽦?섏꽭??
2. 媛?낆꽦 醫뗪쾶 ?⑤씫???섎늻怨??곸젅???뚯젣紐⑹쓣 遺숈뿬二쇱꽭??`;
            }

            await navigator.clipboard.writeText(prompt);
            const now = Date.now();
            const newCopied = { ...copiedState, [api.servId]: now };
            setCopiedState(newCopied);
            localStorage.setItem('copiedPublicData', JSON.stringify(newCopied));
            alert('??湲곗옄 ?꾩슜 吏?ν삎 ?꾨＼?꾪듃媛 蹂듭궗?섏뿀?듬땲??\nAI 湲곗옄 李쎌뿉 遺숈뿬?ｊ린 ?섏뿬 湲곗궗瑜??꾩꽦?섏꽭??');
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
        const matchesCategory = filterCategory === '?꾩껜' || a.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">湲곗궗 愿由???쒕낫??/h1>
                    <p className="text-gray-500 font-medium">?ㅼ떆媛??뺤콉 ?댁뒪 諛?蹂듭? ?뺣낫 釉뚮━??/p>
                </div>
                <Link
                    href="/admin/articles/write"
                    className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
                >
                    <Plus size={20} />
                    ??湲곗궗 ?묒꽦
                </Link>
            </div>

            {/* API News Briefing Area */}
            <div className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Filter size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">?ㅼ떆媛??곗씠???뚯뒪</h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <select
                        className="bg-transparent font-bold text-sm text-gray-700 outline-none cursor-pointer px-2"
                        value={activeApiTab}
                        onChange={(e) => setActiveApiTab(e.target.value as any)}
                    >
                        <optgroup label="?댁뒪 諛?蹂대룄?먮즺">
                            <option value="MCST_PRESS">?뺤콉釉뚮━??(蹂대룄?먮즺)</option>
                            <option value="MCST_NEWS">?뺤콉?댁뒪 (釉뚮━??</option>
                            <option value="MCST_PHOTO">?댁뒪?ы넗</option>
                            <option value="NEWS_ALL">醫낇빀 ?댁뒪 釉뚮━??/option>
                        </optgroup>
                        <optgroup label="?뺤콉 ?뺣낫">
                            <option value="NATIONAL">以묒븰遺泥??듯빀 (蹂듭?濡?</option>
                            <option value="MOGEF">?ъ꽦媛議깅?</option>
                            <option value="SUBSIDY">蹂댁“湲?4</option>
                            <option value="LOCAL">吏?먯껜 ?뱁솕</option>
                            <option value="MOIS_STATS">?듦퀎 ?곗씠??/option>
                        </optgroup>
                    </select>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Search size={16} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="?뚯뒪 ???ㅼ썙??寃??.."
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
                            {isFetchingApi || isFetchingLocal ? '?곗씠?곕? 遺덈윭?ㅻ뒗 以묒엯?덈떎...' : '寃?됰맂 ??ぉ???놁뒿?덈떎.'}
                        </div>
                    ) : (
                        (activeApiTab === 'LOCAL' ? displayLocalApiData : displayApiData)
                        .filter(api => !apiSearchTerm || api.servNm.includes(apiSearchTerm) || api.servDgst.includes(apiSearchTerm))
                        .map(api => {
                            const isCopied = !!copiedState[api.servId];
                            const getRelativeTime = (ds?: string) => {
                                if (!ds || ds.length < 8) return '理쒓렐';
                                const year = parseInt(ds.substring(0, 4));
                                const month = parseInt(ds.substring(4, 6)) - 1;
                                const day = parseInt(ds.substring(6, 8));
                                const date = new Date(year, month, day);
                                const now = new Date();
                                const diff = now.getTime() - date.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                if (days === 0) return '?ㅻ뒛';
                                if (days === 1) return '?댁젣';
                                return `${days}????;
                            };

                            const isNew = getRelativeTime(api.svcfrstRegTs).includes('?ㅻ뒛') || getRelativeTime(api.svcfrstRegTs).includes('?댁젣');
                            const sourceLabels: any = {
                                'MCST_PRESS': { label: '蹂대룄?먮즺', color: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
                                'MCST_NEWS': { label: '?뺤콉?댁뒪', color: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50' },
                                'MCST_PHOTO': { label: '?댁뒪?ы넗', color: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50' },
                                'NATIONAL': { label: '以묒븰遺泥?, color: 'bg-sky-600', text: 'text-sky-700', bg: 'bg-sky-50' },
                                'LOCAL': { label: '吏?먯껜', color: 'bg-orange-600', text: 'text-orange-700', bg: 'bg-orange-50' },
                                'SUBSIDY': { label: '蹂댁“湲?4', color: 'bg-green-600', text: 'text-green-700', bg: 'bg-green-50' },
                                'YOUTH': { label: '泥?뀈?뺤콉', color: 'bg-violet-600', text: 'text-violet-700', bg: 'bg-violet-50' },
                                'MOGEF': { label: '?ш?遺', color: 'bg-pink-600', text: 'text-pink-700', bg: 'bg-pink-50' },
                                'MOIS_STATS': { label: '?듦퀎?먮즺', color: 'bg-gray-600', text: 'text-gray-700', bg: 'bg-gray-50' }
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
                                            {api.priority === 1 && <span className="border border-amber-200 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">以묒슂</span>}
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
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        ?묒꽦??湲곗궗 紐⑸줉
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-xs shadow-sm">
                            <Search size={14} className="text-gray-400" />
                            <input type="text" placeholder="湲곗궗 ?쒕ぉ 寃??.." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="outline-none" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">?쒕ぉ</th>
                                <th className="p-4">?묒꽦??/th>
                                <th className="p-4">?깅줉??/th>
                                <th className="p-4">?곹깭</th>
                                <th className="p-4 text-center">愿由?/th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredArticles.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="font-bold text-gray-900 group-hover:text-blue-600 cursor-pointer" onClick={() => router.push(`/admin/articles/write?id=${item.id}`)}>{item.title}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{item.category}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 font-medium">{item.author}</td>
                                    <td className="p-4 text-gray-500 text-xs">{new Date(item.created_at || item.date || Date.now()).toLocaleDateString('ko-KR')}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.status === 'published' ? '寃뚯떆以? : '?щ쾶'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleOpenCommentModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative">
                                                <MessageCircle size={18} />
                                                {newCommentArticleIds.includes(item.id) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                                            </button>
                                            <button onClick={() => router.push(`/admin/articles/write?id=${item.id}`)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"><Plus size={18} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                    ?뺤콉 ?붿빟
                                </h4>
                                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl">{selectedApiItem.servDgst || '?붿빟 ?뺣낫媛 ?놁뒿?덈떎.'}</p>
                            </section>
                            {selectedApiItem.servDtlLink && (
                                <section>
                                    <h4 className="text-sm font-black text-gray-900 mb-3">?먮낯 留곹겕</h4>
                                    <a href={selectedApiItem.servDtlLink} target="_blank" className="text-blue-600 text-sm hover:underline break-all">{selectedApiItem.servDtlLink}</a>
                                </section>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex gap-3">
                            <button onClick={() => handleCopySource(selectedApiItem)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                <Copy size={18} /> 湲곗궗 ?뚯뒪 蹂듭궗 (?꾨＼?꾪듃 異붿텧)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
