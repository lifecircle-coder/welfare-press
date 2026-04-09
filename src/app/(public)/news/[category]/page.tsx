import { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/common/SafeImage';
import { Newspaper } from 'lucide-react';
import { getArticles, getArticlesByCategory, getTopArticles, getMenus } from '@/lib/services';

export const revalidate = 60; // 1분 단위 캐싱으로 로딩 속도 개선

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
    const categoryName = decodeURIComponent(params.category);
    const menus = await getMenus();
    
    // 기존 슬러그 매핑
    const slugMap: Record<string, string> = {
        'all': '전체',
        'jobs': '일자리·취업',
        'housing': '주거·금융',
        'health': '건강·의료',
        'safety': '생활·안전',
        'childcare': '임신·육아'
    };

    const internalName = slugMap[categoryName] || categoryName;
    const currentMenu = menus.find((m: any) => m.name === internalName && !m.parent_id);
    const displayName = currentMenu ? currentMenu.name : (internalName === '전체' ? '종합' : internalName);

    return {
        title: `${displayName} 뉴스`,
        description: `THE 복지 ${displayName} 카테고리의 최신 복지 정책과 맞춤형 뉴스 정보를 확인하세요.`,
        alternates: {
            canonical: `/news/${categoryName}`,
        },
        openGraph: {
            title: `${displayName} 뉴스 | THE 복지`,
            description: `전국민을 위한 복지 전문 뉴스 - ${displayName} 분야의 핵심 정보를 제공합니다.`,
            url: `https://thebok.co.kr/news/${categoryName}`,
            type: 'website',
        }
    };
}

export async function generateStaticParams() {
    const menus = await getMenus();
    const mainMenus = menus.filter((m: any) => !m.parent_id);
    
    const legacySlugs = ['childcare', 'jobs', 'housing', 'health', 'safety'];
    const params = [
        { category: 'all' },
        ...legacySlugs.map(s => ({ category: s })),
        ...mainMenus.map((m: any) => ({ category: encodeURIComponent(m.name) }))
    ];
    return params;
}

export default async function CategoryNews({ 
    params, 
    searchParams 
}: { 
    params: { category: string };
    searchParams: { prefix?: string };
}) {
    const categoryName = decodeURIComponent(params.category);
    const selectedPrefix = searchParams.prefix ? decodeURIComponent(searchParams.prefix) : '전체';
    const menus = await getMenus();

    // 1. Map URL Slug to Internal Category Name
    const slugMap: Record<string, string> = {
        'all': '전체',
        'jobs': '일자리·취업',
        'housing': '주거·금융',
        'health': '건강·의료',
        'safety': '생활·안전',
        'childcare': '임신·육아'
    };
    const internalCategoryName = slugMap[categoryName] || categoryName;
    
    // Find matching parent menu
    const currentMenu = menus.find((m: any) => m.name === internalCategoryName && !m.parent_id);
    const displayName = currentMenu ? currentMenu.name : (internalCategoryName === '전체' ? '종합' : internalCategoryName);
    
    // Get sub-categories (child menus)
    const subMenus = currentMenu ? menus.filter((m: any) => m.parent_id === currentMenu.id && m.is_visible) : [];

    // 2. Fetch Optimized Data
    // Valid Prefix Check: If selectedPrefix is not in subMenus, fallback to '전체'
    const isPrefixValid = selectedPrefix === '전체' || subMenus.some((s: any) => s.name === selectedPrefix);
    const effectivePrefix = isPrefixValid ? selectedPrefix : '전체';

    const [newsList, topArticles] = await Promise.all([
        categoryName === 'all' || internalCategoryName === '전체'
            ? getArticles(40)
            : getArticlesByCategory(internalCategoryName, 40, 0, effectivePrefix),
        getTopArticles(10)
    ]);

    // Helper for Dynamic Border Color
    const getBorderColor = (slug: string) => {
        switch (slug) {
            case 'jobs': return 'border-blue-600 text-blue-900';
            case 'health': return 'border-green-600 text-green-900';
            case 'housing': return 'border-indigo-600 text-indigo-900';
            case 'safety': return 'border-orange-600 text-orange-900';
            case 'childcare': return 'border-pink-600 text-pink-900';
            default: return 'border-primary text-gray-900';
        }
    };

    // Helper for Dynamic Category Color
    const getCategoryTextColor = (cat: string) => {
        if (cat.includes('일자리')) return 'text-cat-job';
        if (cat.includes('건강')) return 'text-cat-health';
        if (cat.includes('주거')) return 'text-cat-house';
        if (cat.includes('생활')) return 'text-cat-living';
        if (cat.includes('육아')) return 'text-cat-child';
        return 'text-cat-etc';
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Page Title with Dynamic Color */}
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8 border-b-4 pb-4">
                <h1 className={`text-3xl font-bold inline-block border-none pb-0 mb-0 ${getBorderColor(categoryName).split(' ')[1]}`}>
                    {displayName} 뉴스
                </h1>
                
                {/* Sub-category Filter (Prefix) */}
                {subMenus.length > 0 && (
                    <div className="flex-1 overflow-x-auto no-scrollbar py-1">
                        <div className="flex items-center gap-2 px-1">
                            <Link 
                                href={`/news/${categoryName}`}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    selectedPrefix === '전체' 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                전체
                            </Link>
                            {subMenus.sort((a: any, b: any) => a.sort_order - b.sort_order).map((sub: any) => (
                                <Link
                                    key={sub.id}
                                    href={`/news/${categoryName}?prefix=${encodeURIComponent(sub.name)}`}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedPrefix === sub.name
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {sub.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main News List (Left) */}
                <div className="flex-1">
                    <div className="space-y-6">
                        {!newsList || newsList.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <div className="text-4xl mb-4">📢</div>
                                <p className="text-gray-500 font-medium">등록된 기사가 없습니다.</p>
                                <p className="text-gray-400 text-sm mt-2">곧 새로운 소식으로 찾아뵙겠습니다.</p>
                            </div>
                        ) : (
                            newsList.map((news) => (
                                <Link
                                    key={news.id}
                                    href={`/article/${news.id}`}
                                    className="block bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow group"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-48 h-32 relative overflow-hidden rounded-lg flex-shrink-0 bg-gray-100 border border-gray-100">
                                            <SafeImage
                                                src={news.thumbnail}
                                                alt={news.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, 192px"
                                            />
                                            {/* 컨텍스트 기반 라벨링: 현재 카테고리에 맞는 소분류 표시 */}
                                            {(() => {
                                                const currentCatInfo = news.category_list?.find((c: any) => c.category === internalCategoryName);
                                                const displayPrefix = currentCatInfo?.prefix || news.prefix;
                                                
                                                if (!displayPrefix || displayPrefix === '전체') return null;
                                                
                                                const extraCount = (news.category_list?.length || 0) - 1;
                                                
                                                return (
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <span className="bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                                            {displayPrefix}
                                                            {extraCount > 0 && (
                                                                <span className="text-blue-300">+{extraCount}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {news.category_list && news.category_list.length > 0 ? (
                                                    news.category_list.map((cat: any, idx: number) => (
                                                        <span key={`${cat.category}-${idx}`} className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-gray-100 ${getCategoryTextColor(cat.category)}`}>
                                                            {cat.category}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className={`text-sm font-bold ${getCategoryTextColor(news.category)}`}>
                                                        [{news.category}]
                                                    </span>
                                                )}
                                                <span className="text-gray-400 text-xs ml-auto md:ml-0">
                                                    {new Date(news.created_at || news.date || new Date()).toLocaleString('ko-KR', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    })}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary leading-tight">
                                                {news.title}
                                            </h3>
                                            <p className="text-gray-600 line-clamp-2">
                                                {news.summary}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Weekly Top 10 (Right) */}
                <aside className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            🏆 주간 조회수 TOP 10
                        </h3>
                        <ul className="space-y-4">
                            {topArticles.map((item, index) => (
                                <li key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                                    <span className={`w-6 flex-shrink-0 text-lg font-bold ${index < 3 ? 'text-primary' : 'text-gray-400'}`}>
                                        {index + 1}
                                    </span>
                                    <Link href={`/article/${item.id}`} className="text-gray-700 hover:text-primary text-sm font-medium line-clamp-2">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}
