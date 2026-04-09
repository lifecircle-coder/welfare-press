import Link from 'next/link';
import SafeImage from '@/components/common/SafeImage';
import { Newspaper } from 'lucide-react';
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

    const getCategoryStyles = (cat: string) => {
        if (cat.includes('일자리')) return 'bg-cat-job/60 border-cat-job/20';
        if (cat.includes('건강')) return 'bg-cat-health/60 border-cat-health/20';
        if (cat.includes('주거')) return 'bg-cat-house/60 border-cat-house/20';
        if (cat.includes('생활')) return 'bg-cat-living/60 border-cat-living/20';
        if (cat.includes('육아')) return 'bg-cat-child/60 border-cat-child/20';
        return 'bg-cat-etc/60 border-cat-etc/20';
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
                        <SafeImage
                            src={main.thumbnail}
                            alt={main.title}
                            fill
                            priority={true} // High priority for LCP optimization
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 1024px) 100vw, 66vw"
                        />
                        <span className={`absolute top-4 left-4 ${getCategoryStyles(main.category)} px-3 py-1 rounded-full text-sm font-bold text-white shadow-md backdrop-blur-md border border-white/10 flex items-center gap-1.5`}>
                            {main.category}
                            {main.category_list && main.category_list.length > 1 && (
                                <span className="bg-white/20 px-1.5 rounded text-[11px]">+{main.category_list.length - 1}</span>
                            )}
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
                        <span>{new Date(main.created_at || main.date || new Date()).toLocaleString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        })}</span>
                    </div>
                </Link>

                {/* Side Stacked Cards */}
                <div className="flex flex-col gap-6 md:col-span-1">
                    {[sub1, sub2].filter(Boolean).map(article => (
                        <Link key={article.id} href={`/article/${article.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group">
                            <div className="h-40 bg-gray-100 relative overflow-hidden">
                                <SafeImage
                                    src={article.thumbnail}
                                    alt={article.title}
                                    fill
                                    priority={true} // High priority for sub-hero images as well
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <span className={`absolute top-3 left-3 ${getCategoryStyles(article.category)} px-3 py-1 rounded-full text-sm font-bold text-white backdrop-blur-md transition-all shadow-md border border-white/10 flex items-center gap-1`}>
                                    {article.category}
                                    {article.category_list && article.category_list.length > 1 && (
                                        <span className="bg-white/20 px-1 rounded text-[10px]">+{article.category_list.length - 1}</span>
                                    )}
                                </span>
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
