'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getArticles } from '@/lib/services';
import type { Article } from '@/lib/services';

export default function HeroSection() {
    const [heroArticles, setHeroArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHero() {
            setLoading(true);
            const allArticles = await getArticles();

            // Filter published only
            const published = allArticles.filter(a => a.status === 'published');

            if (published.length === 0) {
                setLoading(false);
                return;
            }

            // Group by Category
            const categoryGroups: Record<string, Article[]> = {};
            published.forEach(a => {
                // Determine broad category if prefix is used, or just use category
                // User requirement says "Each menu list". The categories are:
                // '일자리·취업', '주거·금융', '건강·의료', '생활·안전', '임신·육아'
                // Our DB stores "category" as these strings.
                if (!categoryGroups[a.category]) {
                    categoryGroups[a.category] = [];
                }
                categoryGroups[a.category].push(a);
            });

            // For each category, pick the "Best" candidate
            // Priority: Today's News (Latest time) > Recent 7 days (Latest time)
            const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            const categoryCandidates: { category: string, article: Article, isToday: boolean, timestamp: number }[] = [];

            Object.keys(categoryGroups).forEach(cat => {
                const articles = categoryGroups[cat];
                // Sort by date desc (assuming ISO string or YYYY-MM-DD)
                // created_at is not in interface, so we rely on 'date' or verify services.ts adds created_at
                // In services.ts we used 'date: new Date().toISOString()', so it's a full timestamp.
                articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const top = articles[0];
                const isToday = top.date.startsWith(todayStr);

                categoryCandidates.push({
                    category: cat,
                    article: top,
                    isToday: isToday,
                    timestamp: new Date(top.date).getTime()
                });
            });

            // Sort Candidates
            // 1. Has Today's item?
            // 2. Timestamp desc
            categoryCandidates.sort((a, b) => {
                if (a.isToday && !b.isToday) return -1;
                if (!a.isToday && b.isToday) return 1;
                return b.timestamp - a.timestamp;
            });

            // Pick Top 3
            const selected = categoryCandidates.slice(0, 3).map(c => c.article);

            setHeroArticles(selected);
            setLoading(false);
        }

        loadHero();
    }, []);

    if (loading) return <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl"></div>;

    // If fewer than 3, we just show what we have. 
    // The UI handles 1, 2, or 3 items robustly implicitly? 
    // We need to ensure we don't crash.
    const main = heroArticles[0];
    const sub1 = heroArticles[1];
    const sub2 = heroArticles[2];

    if (!main) return null; // Nothing to show

    // Helper for placeholder color
    const getBgColor = (cat: string) => {
        if (cat.includes('일자리')) return 'bg-blue-400';
        if (cat.includes('건강')) return 'bg-green-400';
        if (cat.includes('주거')) return 'bg-indigo-400';
        if (cat.includes('생활')) return 'bg-orange-400';
        if (cat.includes('육아')) return 'bg-pink-400';
        return 'bg-gray-400';
    };
    const getSubBgColor = (cat: string) => {
        if (cat.includes('일자리')) return 'bg-blue-300';
        if (cat.includes('건강')) return 'bg-green-300';
        if (cat.includes('주거')) return 'bg-indigo-300';
        if (cat.includes('생활')) return 'bg-orange-300';
        if (cat.includes('육아')) return 'bg-pink-300';
        return 'bg-gray-300';
    };

    return (
        <section className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">오늘의 주요 뉴스</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

                {/* Main Hero Card (Left, Large) */}
                <Link href={`/article/${main.id}`} className="md:col-span-2 group cursor-pointer block">
                    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-4 shadow-sm bg-gray-100">
                        {/* Use Thumbnail if available, else Color Placeholder */}
                        {main.thumbnail ? (
                            <img src={main.thumbnail} alt={main.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center text-white text-4xl font-bold ${getBgColor(main.category)}`}>
                                {main.category}
                            </div>
                        )}
                        <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                            주요 뉴스
                        </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors leading-tight">
                        {main.title}
                    </h3>
                    <p className="text-lg text-gray-600 line-clamp-2 leading-relaxed">
                        {main.summary}
                    </p>
                    <div className="mt-4 flex items-center text-sm text-gray-500 gap-4">
                        <span>{main.author}</span>
                        <span>{new Date(main.date).toLocaleDateString()}</span>
                    </div>
                </Link>

                {/* Side Stacked Cards (Right, Small) */}
                <div className="flex flex-col gap-6 md:col-span-1">
                    {[sub1, sub2].filter(Boolean).map(article => (
                        <Link key={article.id} href={`/article/${article.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group">
                            <div className="h-40 bg-gray-100 relative overflow-hidden">
                                {article.thumbnail ? (
                                    <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-white font-bold ${getSubBgColor(article.category)}`}>
                                        {article.category}
                                    </div>
                                )}
                                <span className="absolute top-2 left-2 bg-gray-900 bg-opacity-50 text-white px-2 py-0.5 rounded text-xs backdrop-blur-sm">{article.category}</span>
                            </div>
                            <div className="p-4 flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-primary line-clamp-2">
                                    {article.title}
                                </h4>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                    {article.summary}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}
