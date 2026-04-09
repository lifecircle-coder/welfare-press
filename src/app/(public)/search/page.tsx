import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { searchArticles } from '@/lib/services';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '뉴스 검색',
        description: 'THE 복지의 기사를 검색하여 원하는 정보를 빠르게 찾아보세요.',
        robots: {
            index: false,
            follow: true,
        },
        alternates: {
            canonical: '/search',
        },
    };
}

export const revalidate = 0; // 검색은 항상 최신 결과를 보장해야 하므로 캐싱 비활성화 또는 짧게 설정

async function SearchResults({ query }: { query: string | null }) {
    if (!query) {
        return <div className="text-center py-20 text-gray-500">검색어를 입력해주세요.</div>;
    }

    const results = await searchArticles(query);

    if (results.length === 0) {
        return <div className="text-center py-20 text-gray-400">검색 결과가 없습니다.</div>;
    }

    return (
        <div className="space-y-6">
            {results.map((news) => (
                <Link
                    key={news.id}
                    href={`/article/${news.id}`}
                    className="block bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary text-sm font-bold">
                            [{news.category}
                            {news.category_list && news.category_list.length > 1 && (
                                <span className="text-xs font-normal ml-0.5">+{news.category_list.length - 1}</span>
                            )}]
                        </span>
                                                <span className="text-gray-400 text-sm">
                            {new Date(news.created_at || news.date || new Date()).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                        {news.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                        {news.summary}
                    </p>
                </Link>
            ))}
        </div>
    );
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const query = searchParams.q || null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[60vh]">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">
                {query ? (
                    <>
                        <span className="text-primary">&apos;{query}&apos;</span> 검색 결과
                    </>
                ) : (
                    '기사 검색'
                )}
            </h1>

            <Suspense fallback={<div className="text-center py-20 text-gray-500">검색 결과를 불러오는 중...</div>}>
                <SearchResults query={query} />
            </Suspense>
        </div>
    );
}
