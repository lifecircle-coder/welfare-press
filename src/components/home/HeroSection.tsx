import Link from 'next/link';
import Image from 'next/image';
import { Newspaper } from 'lucide-react';
import type { Article } from '@/lib/services';
import Image from 'next/image';
import type { Article } from '@/lib/services';

interface HeroSectionProps {
    articles: Article[];
}

export default function HeroSection({ articles }: HeroSectionProps) {
    if (!articles || articles.length === 0) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-4">🏠</div>
                    <p className="text-gray-500 font-medium">등록된 주요 뉴스가 없습니다.</p>
                </div>
            </div>
        );
    }

    // Since articles are pre-fetched and sorted by the server-side specialized service,
    // we can directly pick the top 3.
    const main = articles[0];
    const sub1 = articles[1];
    const sub2 = articles[2];

    if (!main) return null;

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
                {/* Main Hero Card */}
                <Link href={`/article/${main.id}`} className="md:col-span-2 group cursor-pointer block">
                    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-4 shadow-sm bg-gray-100">
                        {main.thumbnail ? (
                            <Image
                                src={main.thumbnail}
                                alt={main.title}
                                fill
                                priority={true} // High priority for LCP optimization
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 1024px) 100vw, 66vw"
                            />
                        ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center text-white ${getBgColor(main.category)}`}>
                                <div className="p-4 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                                    <Newspaper size={48} className="text-white" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight mb-2">The 복(福)</span>
                                <span className="text-sm font-medium bg-black/20 px-3 py-1 rounded-full">{main.category}</span>
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

                {/* Side Stacked Cards */}
                <div className="flex flex-col gap-6 md:col-span-1">
                    {[sub1, sub2].filter(Boolean).map(article => (
                        <Link key={article.id} href={`/article/${article.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group">
                            <div className="h-40 bg-gray-100 relative overflow-hidden">
                                {article.thumbnail ? (
                                    <Image
                                        src={article.thumbnail}
                                        alt={article.title}
                                        fill
                                        priority={true} // High priority for sub-hero images as well
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex flex-col items-center justify-center text-white ${getSubBgColor(article.category)}`}>
                                        <div className="p-2 bg-white/20 rounded-full mb-2 backdrop-blur-sm">
                                            <Newspaper size={32} className="text-white" />
                                        </div>
                                        <span className="text-xl font-bold tracking-tight mb-1">The 복(福)</span>
                                        <span className="text-xs font-medium bg-black/20 px-2 py-0.5 rounded-full">{article.category}</span>
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
