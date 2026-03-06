'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getArticles } from '@/lib/services';
import type { Article } from '@/lib/services';

export default function LatestNews() {
    const [news, setNews] = useState<Article[]>([]);

    useEffect(() => {
        async function loadNews() {
            const allArticles = await getArticles();
            const published = allArticles.filter(a => a.status === 'published');

            // Defined Fixed Order:
            // 1. 건강·의료 (Health)
            // 2. 임신·육아 (Pregnancy)
            // 3. 일자리·취업 (Jobs)
            // 4. 생활·안전 (Life)
            // 5. 주거·금융 (Housing)
            const targetCategories = ['건강·의료', '임신·육아', '일자리·취업', '생활·안전', '주거·금융'];
            const selectedArticles: Article[] = [];

            // For each category, find the latest article
            targetCategories.forEach(cat => {
                // Find articles matching the category
                const matches = published.filter(a => a.category === cat);
                // Sort by date desc
                matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (matches.length > 0) {
                    selectedArticles.push(matches[0]);
                }
            });

            setNews(selectedArticles);
        }

        loadNews();
    }, []);

    // Helper for category color
    const getCategoryColor = (cat: string) => {
        if (cat.includes('일자리')) return 'text-blue-600';
        if (cat.includes('건강')) return 'text-green-600';
        if (cat.includes('주거')) return 'text-indigo-600';
        if (cat.includes('생활')) return 'text-orange-600';
        if (cat.includes('육아')) return 'text-pink-600';
        return 'text-gray-600';
    };

    return (
        <section className="container mx-auto px-4 py-8 bg-gray-50 rounded-2xl my-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">분야별 최신 뉴스</h2>
            </div>

            <div className="flex flex-col divide-y divide-gray-200 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {news.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        등록된 뉴스가 없습니다.
                    </div>
                ) : (
                    news.map((item) => (
                        <Link
                            key={item.id}
                            href={`/article/${item.id}`}
                            className="flex items-start md:items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                        >
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2 md:mb-1">
                                    <span className={`font-bold text-sm ${getCategoryColor(item.category)}`}>[{item.category}]</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-medium text-gray-800 group-hover:text-primary">
                                    {item.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-gray-400 text-sm hidden md:block">{new Date(item.date).toLocaleDateString()}</span>
                                {/* Thumbnail */}
                                {item.thumbnail ? (
                                    <img src={item.thumbnail} alt={item.title} className="w-24 h-24 md:w-32 md:h-20 rounded-lg object-cover" />
                                ) : (
                                    <div className={`w-24 h-24 md:w-32 md:h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-white font-bold bg-gray-300`}>
                                        {item.category.substring(0, 2)}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}
