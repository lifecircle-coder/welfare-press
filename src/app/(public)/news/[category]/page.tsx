import { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/common/SafeImage';
import { Newspaper } from 'lucide-react';
import { getArticles, getArticlesByCategory, getTopArticles } from '@/lib/services';

export const revalidate = 60; // 1분 단위 캐싱으로 로딩 속도 개선

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
    const categoryName = decodeURIComponent(params.category);
    const categoryTitleMap: Record<string, string> = {
        'all': '종합',
        'jobs': '일자리·취업',
        'housing': '주거·금융',
        'health': '건강·의료',
        'safety': '생활·안전',
        'childcare': '임신·육아'
    };
    const displayName = categoryTitleMap[categoryName] || '뉴스';

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
    return [
        { category: 'all' },
        { category: 'childcare' },
        { category: 'jobs' },
        { category: 'housing' },
        { category: 'health' },
        { category: 'safety' },
    ];
}

export default async function CategoryNews({ params }: { params: { category: string } }) {
    const categoryName = decodeURIComponent(params.category);

    // 1. Map URL Slug to Internal Category Name (Full names for exact matching)
    // [데이터 매핑 전수 조사] URL 슬러그와 DB 실제 값 일치 확인
    const categoryMap: Record<string, string> = {
        'all': '전체',
        'jobs': '일자리·취업',
        'housing': '주거·금융',
        'health': '건강·의료',
        'safety': '생활·안전',
        'childcare': '임신·육아'
    };
    const internalCategory = categoryMap[categoryName];

    // 2. Fetch Optimized Data in Parallel (Directly from DB using index)
    // [호출 의존성 조사] 'all' 슬러그에 대해 필터링 없이 모든 기사 호출 보장
    const [newsList, topArticles] = await Promise.all([
        categoryName === 'all' || !internalCategory || internalCategory === '전체'
            ? getArticles(40)
            : getArticlesByCategory(internalCategory, 40),
        getTopArticles(10)
    ]);

    // UI Mapping
    const categoryTitleMap: Record<string, string> = {
        'all': '종합',
        'jobs': '일자리·취업',
        'housing': '주거·금융',
        'health': '건강·의료',
        'safety': '생활·안전',
        'childcare': '임신·육아'
    };
    const displayName = categoryTitleMap[categoryName] || '뉴스';

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
            <h1 className={`text-3xl font-bold mb-8 border-b-4 pb-4 inline-block ${getBorderColor(categoryName)}`}>
                {displayName} 뉴스
            </h1>

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
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-sm font-bold ${getCategoryTextColor(news.category)}`}>[{news.category}]</span>
                                                <span className="text-gray-400 text-sm">
                                                    {new Date(news.created_at || news.date || new Date()).toLocaleString('ko-KR', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
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
