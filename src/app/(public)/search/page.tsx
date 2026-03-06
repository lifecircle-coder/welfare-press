import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchArticles } from '@/lib/services';
import type { Article } from '@/lib/services';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query) {
                setLoading(true);
                const data = await searchArticles(query);
                setResults(data);
                setLoading(false);
            } else {
                setResults([]);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                <span className="text-primary">&apos;{query}&apos;</span> 검색 결과
            </h1>

            {loading ? (
                <div className="text-center py-20 text-gray-500">검색 중...</div>
            ) : query && results.length > 0 ? (
                <div className="space-y-6">
                    {results.map((news) => (
                        <Link
                            key={news.id}
                            href={`/article/${news.id}`}
                            className="block bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-primary text-sm font-bold">[{news.category}]</span>
                                <span className="text-gray-400 text-sm">{news.date}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {news.title}
                            </h3>
                            <p className="text-gray-600 line-clamp-2">
                                {news.summary || news.content?.substring(0, 100).replace(/<[^>]*>?/gm, '')}
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    {query ? '검색 결과가 없습니다.' : '검색어를 입력해주세요.'}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
            <SearchContent />
        </Suspense>
    );
}
