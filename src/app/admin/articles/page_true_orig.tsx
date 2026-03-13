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
    const [filterCategory, setFilterCategory] = useState('?꾩껜');
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
        if (confirm('?뺣쭚 ??젣?섏떆寃좎뒿?덇퉴?')) {
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

            if (api.apiSource === 'LOCAL') {
                const detail = await getLocalGovWelfareDetail(api.servId);
                prompt = `[?뺢린??湲곗궗 ?묒꽦???뚯뒪]
?꾨옒 怨듦났?곗씠?고룷???쒓뎅?ы쉶蹂댁옣?뺣낫???먯꽌 ?섏쭛??吏?먯껜 ?뱁솕 蹂듭? ?뺤콉 ?곗씠?곕? 諛뷀깢?쇰줈, ?대떦 吏??二쇰??ㅼ씠 ?댄빐?섍린 ?쎄퀬 移쒖젅???덈궡 湲곗궗瑜??묒꽦?댁＜?몄슂.

--- [?섏쭛???먮낯 ?곗씠?? ---
* 吏?먯껜紐? ${api.jurMnofNm}
* ?뺤콉紐? ${api.servNm}
* ?뺤콉 ?붿빟: ${api.servDgst}
* 吏????? ${detail?.trgterIndvdlArray || '?곸꽭 ?뺣낫 李몄“'}
* ?좎젙 湲곗?: ${detail?.slctCritCn || '?곸꽭 ?뺣낫 李몄“'}
* ?곸꽭 ?쒗깮: ${detail?.alwServCn || '?곸꽭 ?뺣낫 李몄“'}
* ?낅뜲?댄듃?? ${detail?.svcfrstRegTs || '誘몄긽'}

--- [?묒꽦 媛?대뱶] ---
1. 湲곗궗 ?쒕ぉ: ?듭떖 ?쒗깮怨?吏?먯껜紐?${api.jurMnofNm})??吏곴??곸쑝濡??????덈뒗 留ㅻ젰?곸씤 ?쒕ぉ
2. ?붿빟蹂? 1~2以꾩쓽 ?듭떖 ?붿빟
3. 移댄뀒怨좊━/留먮㉧由??쒖븞: (?? 移댄뀒怨좊━-?쇱옄由р?랬?? 留먮㉧由?李쎌뾽)
**移댄뀒怨좊━蹂?留먮㉧由?**1) 嫄닿컯??쓽猷?: 嫄닿컯, ?섎즺, 蹂댄뿕, ?대룞
**2) ?꾩떊??쑁??: ?꾩떊, ?≪븘, 蹂댁쑁, 吏??**3) ?쇱옄由р?랬??: ?쇱옄由? 痍⑥뾽, 李쎌뾽, 援먯쑁
**4) ?앺솢??븞??: ?앺솢, ?덉쟾, 援먰넻, ?섍꼍
**5) 二쇨굅??툑??: 二쇨굅, 湲덉쑖, 泥?빟, ?異?4. 蹂몃Ц ?댁슜: '吏?????, '?좎젙 湲곗?', '吏???댁슜' ?깆쓣 媛?낆꽦 ?덇쾶 ?묒꽦?섎릺 ?ㅼ젣 二쇰??ㅼ뿉寃???용뒗 ?쒗깮 ?꾩＜濡??뺣━?댁＜?몄슂. **(以묒슂) ?녿뒗 ?댁슜??吏?대궡吏 留덉꽭??**
5. 吏???뱁솕 ?곗텧: 湲곗궗 ?쒕몢???대떦 吏??二쇰??ㅼ뿉寃?諛섍????뚯떇?꾩쓣 媛뺤“
6. ?댁떆?쒓렇 : 湲곗궗??遺?⑸릺???댁떆?쒓렇 3~7媛??묒꽦
7. ?몃꽕???대?吏 : 湲곗궗??遺?⑸릺???ㅼ궗 ?ㅽ??쇱쓽 媛濡쒗삎 ?쒓뎅 諛곌꼍 ?대?吏 ?쒖옉 (?멸뎅???쒖쇅)
8. ?쒓린 ?좎쓽 ?ы빆 : AI?ㅻ윭??湲고샇(:, **) ?ъ슜???먯젣?섍퀬 ?먯뿰?ㅻ읇寃??묒꽦.
`;
            } else if (api.apiSource === 'MOGEF') {
                prompt = `[?뺢린??湲곗궗 ?묒꽦???뚯뒪]
?꾨옒 怨듦났?곗씠?고룷?몄뿉???섏쭛???좉퇋 ?ъ꽦媛議깅? ?뺤콉(?댁뒪) ?곗씠?곕? 諛뷀깢?쇰줈, 援???ㅼ씠 ?댄빐?섍린 ?쎄퀬 移쒖젅???덈궡 湲곗궗瑜??묒꽦?댁＜?몄슂.

--- [?섏쭛???먮낯 ?곗씠?? ---
* 湲곌?紐? ${api.jurMnofNm}
* ?뺤콉 ?댁뒪 ?쒕ぉ: ${api.servNm}
* ?깅줉?? ${api.svcfrstRegTs || '誘몄긽'}
* ?곸꽭 留곹겕: ${api.servDtlLink || '誘몄긽'}

--- [?묒꽦 媛?대뱶] ---
??湲곗옄, ???뚯뒪???덈뒗 '?곸꽭 留곹겕'??蹂몃Ц ?댁슜???쎄퀬 ?꾨옒 吏?쒖궗???濡?湲곗궗瑜??⑥?!

1. 湲곗궗 ?쒕ぉ: ?뺤콉???듭떖??吏곴??곸쑝濡?蹂댁뿬二쇰뒗 留ㅻ젰?곸씤 ?쒕ぉ
2. ?붿빟蹂? 1~2以꾩쓽 ?듭떖 ?붿빟
3. 蹂몃Ц ?댁슜: ?댁뒪 釉뚮━???щ㎎?쇰줈 媛?낆꽦 ?덇쾶 ?묒꽦. 援???ㅼ씠 ?살쓣 ???덈뒗 ?쒗깮?대굹 蹂?붾맂 ?먯쓣 媛뺤“. **(以묒슂) ?⑺듃??湲곕컲???묒꽦?섏꽭??**
4. ?댁떆?쒓렇: 3~7媛??쒖븞
5. ?몃꽕???대?吏: ?쒓뎅?곸씤 ?먮굦???ㅼ궗 ?뱀? 源붾걫???쇰윭?ㅽ듃 ?대?吏 ?쒖옉
6. ?쒓린 ?좎쓽 ?ы빆: ?뱀닔臾몄옄(:, **) ?ъ슜 ?먯젣, ?먯뿰?ㅻ윭??援ъ뼱泥??ъ슜.
`;
            } else if (api.apiSource === 'SUBSIDY' || api.apiSource === 'YOUTH') {
                prompt = `[?뺢린??湲곗궗 ?묒꽦???뚯뒪]
?꾨옒 怨듦났?곗씠?고룷?몄뿉???섏쭛??${api.apiSource === 'SUBSIDY' ? '蹂댁“湲?4' : '泥?뀈?뺤콉'} ?곗씠?곕? 諛뷀깢?쇰줈, 援?????섑삙 以묒떖 ?덈궡 湲곗궗瑜??묒꽦?댁＜?몄슂.

--- [?섏쭛???먮낯 ?곗씠?? ---
* 異쒖쿂: ${api.apiSource === 'SUBSIDY' ? '?됱젙?덉쟾遺(蹂댁“湲?4)' : '?⑤씪?몄껌?꾩꽱??泥?뀈?뺤콉)'}
* ?뺤콉紐? ${api.servNm}
* 二쇱슂 ?댁슜: ${api.servDgst}
* ?뚭?湲곌?: ${api.jurMnofNm}
* ?낅뜲?댄듃?? ${api.svcfrstRegTs || '誘몄긽'}

--- [?묒꽦 媛?대뱶] ---
??湲곗옄, ??湲곗궗???듭떖? **'?낆옄媛 ?볦튂怨??덈뒗 ?쒗깮'**??吏싳뼱二쇰뒗 嫄곗빞!

1. 湲곗궗 ?쒕ぉ: 湲덉븸?대굹 援ъ껜???쒗깮??媛뺤“???뚭꺽?곸씤 ?쒕ぉ
2. ?붿빟蹂? 1~2以꾩쓽 ?듭떖 ?붿빟 (??湲곗궗瑜??쎄퀬 臾댁뾿???좎껌?댁빞 ?섎뒗吏)
3. 蹂몃Ц ?댁슜: '???, '?쒗깮', '諛⑸쾿'??以묒떖?쇰줈 移쒖젅?섍쾶 ?ㅻ챸. ?놁쭛 ?댁썐?먭쾶 ?뚮젮二쇰벏 ?묒꽦. **(以묒슂) ?ъ떎 湲곕컲 ?묒꽦.**
4. ?댁떆?쒓렇: 3~7媛??쒖븞
5. ?몃꽕???대?吏: ?쒗깮???먮굦???댁븘?덈뒗 ?ㅼ궗 ?ㅽ????대?吏 ?쒖옉 (?쒓뎅??紐⑤뜽)
6. ?쒓린 ?좎쓽 ?ы빆: ?먯뿰?ㅻ윭??臾몄옣 ?ъ슜, ?뱀닔 湲고샇 ?먯젣.
`;
            } else {
                const detail = await getNationalWelfareDetail(api.servId);
                prompt = `[?뺢린??湲곗궗 ?묒꽦???뚯뒪]
?꾨옒 怨듦났?곗씠?고룷?몄뿉???섏쭛???좉퇋 蹂듭? ?뺤콉 ?곗씠?곕? 諛뷀깢?쇰줈, 援???ㅼ씠 ?댄빐?섍린 ?쎄퀬 移쒖젅???덈궡 湲곗궗瑜??묒꽦?댁＜?몄슂.

--- [?섏쭛???먮낯 ?곗씠?? ---
* 湲곌?紐? ${api.jurMnofNm}
* ?뺤콉紐? ${api.servNm}
* ?뺤콉 ?붿빟: ${api.servDgst || '?곸꽭 ?댁슜 李몄“'}
* 吏????? ${detail?.trgterIndvdlArray || '?곸꽭 ?뺣낫 李몄“'}
* ?좎젙 湲곗?: ${detail?.slctCritCn || '?곸꽭 ?뺣낫 李몄“'}
* ?곸꽭 ?쒗깮: ${detail?.alwServCn || '?곸꽭 ?뺣낫 李몄“'}
* ?깅줉?? ${api.svcfrstRegTs || '誘몄긽'}

--- [?묒꽦 媛?대뱶] ---
1. 湲곗궗 ?쒕ぉ: ?듭떖 ?쒗깮怨???곸쓣 吏곴??곸쑝濡??????덈뒗 留ㅻ젰?곸씤 ?쒕ぉ
2. ?붿빟蹂? 1~2以꾩쓽 ?듭떖 ?붿빟
3. 蹂몃Ц ?댁슜: '?꾧?', '?대뼸寃?, '臾댁뾿?? 諛쏅뒗吏 媛?낆꽦 ?덇쾶 ?뺣━. **(以묒슂) ?⑺듃泥댄겕 ?꾩닔.**
4. ?댁떆?쒓렇: 3~7媛??쒖븞
5. ?몃꽕???대?吏: 湲곗궗???댁슱由щ뒗 ?곕쑜??遺꾩쐞湲곗쓽 ?ㅼ궗 ?대?吏 ?쒖옉 (?쒓뎅 諛곌꼍)
6. ?쒓린 ?좎쓽 ?ы빆: AI ?곌? ?섏? ?딅룄濡??먯뿰?ㅻ윭???댄쐶 ?ъ슜.
`;
            }

            await navigator.clipboard.writeText(prompt);
            const newCopiedState = { ...copiedState, [api.servId]: Date.now() };
            setCopiedState(newCopiedState);
            localStorage.setItem('copiedPublicData', JSON.stringify(newCopiedState));
            alert('湲곗궗 ?묒꽦???뚯뒪媛 蹂듭궗?섏뿀?듬땲?? ?뺢린?먯뿉寃??꾨떖?섏꽭??');
        } catch (error) {
            console.error(error);
            alert('?뚯뒪 蹂듭궗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
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
        const matchesCategory = filterCategory === '?꾩껜' || article.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">湲곗궗 愿由?/h2>
                <Link
                    href="/admin/articles/write"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    湲곗궗 ?묒꽦
                </Link>
            </div>

            {/* Public Data API Source List */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 shadow-sm">
                <div className="flex flex-col mb-4 gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs tracking-wider">NEW</span>
                            怨듦났?곗씠???ы꽭 ?뚯뒪 寃??                        </h3>
                        <button
                            onClick={() => activeApiTab === 'LOCAL' ? loadLocalApiData() : loadApiData(activeApiTab)}
                            disabled={activeApiTab === 'LOCAL' ? isFetchingLocal : isFetchingApi}
                            className="text-sm text-blue-600 hover:text-blue-800 font-bold underline"
                        >
                            {(activeApiTab === 'LOCAL' ? isFetchingLocal : isFetchingApi) ? '?숆린??以?..' : '?섎룞 ?숆린??}
                        </button>
                    </div>

                    {/* ?꾩?留?諛뺤뒪 */}
                    <div className="bg-blue-100/50 border border-blue-200 p-3 rounded-lg text-[13px] text-blue-800 leading-relaxed shadow-inner">
                        <p className="font-bold mb-1 flex items-center gap-1.5 text-blue-900"><Search size={14} /> ?대뼸寃??ъ슜?섎굹??</p>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                            <li>?섎떒?????ъ꽦媛議깅?, 蹂댁“湲?4 ?????좏깮??理쒖떊 ?뺤콉 ?뺣낫瑜?李얠쑝?몄슂.</li>
                            <li>湲곗궗?뷀븯怨??띠? ??ぉ??<strong>[?뚯뒪 蹂듭궗]</strong> 踰꾪듉???꾨Ⅴ?몄슂.</li>
                            <li>蹂듭궗???댁슜??<strong>??湲곗옄</strong>(湲곗궗 ?묒꽦 ?섏씠吏)?먭쾶 ?꾨떖?섎㈃ 湲곗궗媛 ?꾩꽦?⑸땲??</li>
                        </ul>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-blue-200 overflow-x-auto no-scrollbar mb-4 gap-1">
                    {[
                        { id: 'NATIONAL', label: '?꾧뎅 ?듯빀 (蹂듭?濡?', color: 'blue' },
                        { id: 'MOGEF', label: '?ъ꽦媛議깅?', color: 'pink' },
                        { id: 'SUBSIDY', label: '蹂댁“湲?4 (?됱븞遺)', color: 'green' },
                        { id: 'YOUTH', label: '泥?뀈?뺤콉', color: 'purple' },
                        { id: 'LOCAL', label: '吏?먯껜 ?뱁솕', color: 'orange' }
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
                                吏?먯껜 留욎땄??蹂듭? ?뺤콉???섏쭛?섍퀬 ?덉뒿?덈떎...
                            </div>
                        ) : localApiData.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                                ?섏쭛??吏?먯껜 紐⑸줉???놁뒿?덈떎.
                            </div>
                        ) : (
                            displayLocalApiData.map(api => {
                                const isCopied = !!copiedState[api.servId];
                                return (
                                    <div key={api.servId} className="bg-white p-4 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm hover:border-orange-400 hover:shadow transition-all group">
                                        <div className="flex-1 pr-6">
                                            <div className="text-xs text-orange-600 font-bold mb-1 flex items-center gap-2">
                                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                                                    <MapPin size={10} /> 吏?먯껜API
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
                                                {isCopied ? '蹂듭궗 ?꾨즺' : <><Copy size={16} /> ?곸꽭蹂듭궗</>}
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
                                ?곗씠?곕? 遺덈윭?ㅻ뒗 以묒엯?덈떎...
                            </div>
                        ) : apiData.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                                寃?됰맂 紐⑸줉???놁뒿?덈떎.
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
                                                    }`}>{api.apiSource || '蹂닿굔蹂듭?遺'}</span>
                                                {api.jurMnofNm}
                                                <span className="text-gray-400 font-normal">|</span>
                                                <span className="text-gray-500 font-normal flex items-center gap-1"><Calendar size={12} /> {api.svcfrstRegTs ? formatRegDate(api.svcfrstRegTs) : '理쒓렐'}</span>
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
                                                {isCopied ? '蹂듭궗 ?꾨즺' : <><Copy size={16} /> ?뚯뒪 蹂듭궗</>}
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
                        placeholder="?쒕ぉ, ?댁슜 寃??
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
                    <option value="?꾩껜">?꾩껜 移댄뀒怨좊━</option>
                    <option value="?쇱옄由?룹랬??>?쇱옄由?룹랬??/option>
                    <option value="二쇨굅쨌湲덉쑖">二쇨굅쨌湲덉쑖</option>
                    <option value="嫄닿컯쨌?섎즺">嫄닿컯쨌?섎즺</option>
                    <option value="?앺솢쨌?덉쟾">?앺솢쨌?덉쟾</option>
                    <option value="?꾩떊쨌?≪븘">?꾩떊쨌?≪븘</option>
                </select>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 bg-white">
                    <Calendar size={16} /> 湲곌컙 ?ㅼ젙
                </div>
            </div>

            {/* Article List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium">?쒕ぉ</th>
                            <th className="p-4 font-medium">?묒꽦??/th>
                            <th className="p-4 font-medium">遺꾨쪟</th>
                            <th className="p-4 font-medium">?곹깭</th>
                            <th className="p-4 font-medium">諛쒗뻾??(created_at)</th>
                            <th className="p-4 font-medium">?섏젙??(updated_at)</th>
                            <th className="p-4 font-medium">愿由?/th>
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
                                            寃뚯떆以?                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-bold">
                                            誘멸쾶??(?꾩떆???
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
                                            ?볤?蹂닿린
                                        </button>
                                        <button onClick={() => router.push(`/admin/articles/write?id=${item.id}`)} className="text-gray-400 hover:text-gray-600 border px-2 py-1 rounded">?섏젙</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredArticles.length === 0 && (
                    <div className="p-12 text-center text-gray-500">?깅줉??湲곗궗媛 ?놁뒿?덈떎.</div>
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
                                <p className="text-xs text-gray-500 mt-1">湲곗궗 ?볤? 愿由?({modalComments.length})</p>
                            </div>
                            <button onClick={() => setIsCommentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                            {modalComments.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">?깅줉???볤????놁뒿?덈떎. ?낆옄? ?뚰넻???쒖옉?대낫?몄슂!</div>
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
                                                    ?듦??ш린
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
                                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold">?묒꽦??/span>
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
                                                        placeholder="?듦? ?댁슜???낅젰?섏꽭??.."
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
                                        placeholder="???볤????묒꽦?섏꽭??.. (湲곗옄/愿由ъ옄 紐낆쓽)"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                                    />
                                    <div className="absolute bottom-2 left-4 text-[10px] text-gray-400 font-medium">
                                        ?묒꽦?? <span className="text-primary font-bold">{currentUser?.name || '愿由ъ옄'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePostAdminComment()}
                                    className="px-6 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-500/20"
                                >
                                    <Send size={20} />
                                    <span className="text-xs">?깅줉</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
