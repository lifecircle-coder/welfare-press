'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getArticles } from '@/lib/services';
import type { Article } from '@/lib/services';

export default function CategoryNews({ params }: { params: { category: string } }) {
    const categoryName = decodeURIComponent(params.category);
    const [newsList, setNewsList] = useState<Article[]>([]);
    const [topArticles, setTopArticles] = useState<Article[]>([]);

    useEffect(() => {
        const fetchNews = async () => {
            const allArticles = await getArticles();

            // 1. Map URL Slug to Internal Category Name
            const categoryMap: Record<string, string> = {
                'childcare': '육아',
                'jobs': '일자리',
                'housing': '주거',
                'health': '건강',
                'safety': '생활',
            };
            const internalCategory = categoryMap[categoryName];

            // 2. Filter Logic
            if (categoryName === 'all' || !internalCategory) {
                // General or All
                setNewsList(allArticles);
            } else {
                // Specific Category
                setNewsList(allArticles.filter(a => a.category === internalCategory || a.category.includes(internalCategory)));
            }

            // 3. Top 10 by Views (Global)
            const sorted = [...allArticles].sort((a, b) => b.views - a.views).slice(0, 10);
            setTopArticles(sorted);
        };

        fetchNews();
    }, [categoryName]);

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

    // Helper for Dynamic Border Color (User Request #5)
    // "Changes underline color to match the category theme"
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
                        {newsList.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                등록된 기사가 없습니다.
                            </div>
                        ) : (
                            newsList.map((news) => (
                                <Link
                                    key={news.id}
                                    href={`/article/${news.id}`}
                                    className="block bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow group"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Thumbnail Placeholder */}
                                        {/* Thumbnail or Placeholder */}
                                        {news.thumbnail ? (
                                            <img
                                                src={news.thumbnail}
                                                alt={news.title}
                                                className="w-full md:w-48 h-32 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                            />
                                        ) : (
                                            <div className={`w-full md:w-48 h-32 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold
                                                ${news.category === '일자리' ? 'bg-blue-300' :
                                                    news.category === '건강' ? 'bg-green-300' :
                                                        news.category === '주거' ? 'bg-indigo-300' :
                                                            news.category === '생활' ? 'bg-orange-300' :
                                                                news.category === '육아' ? 'bg-pink-300' : 'bg-gray-300'}
                                            `}>
                                                {news.category}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-primary text-sm font-bold">[{news.category}]</span>
                                                <span className="text-gray-400 text-sm">{news.date}</span>
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
