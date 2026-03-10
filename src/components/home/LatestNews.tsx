import Link from 'next/link';
import SafeImage from '@/components/common/SafeImage';
import { Newspaper } from 'lucide-react';
import type { Article } from '@/lib/services';

interface LatestNewsProps {
    articles: Article[];
}

export default function LatestNews({ articles }: LatestNewsProps) {
    // 기사가 있는 경우 모든 기사를 보여주도록 변경 (범주별 1개 제한 제거)
    const selectedArticles = articles;

    const getCategoryStyles = (cat: string) => {
        if (cat.includes('일자리')) return 'bg-cat-job/80 text-cat-job';
        if (cat.includes('건강')) return 'bg-cat-health/80 text-cat-health';
        if (cat.includes('주거')) return 'bg-cat-house/80 text-cat-house';
        if (cat.includes('생활')) return 'bg-cat-living/80 text-cat-living';
        if (cat.includes('육아')) return 'bg-cat-child/80 text-cat-child';
        return 'bg-cat-etc/80 text-cat-etc';
    };

    const getCategoryTextColor = (cat: string) => {
        if (cat.includes('일자리')) return 'text-cat-job';
        if (cat.includes('건강')) return 'text-cat-health';
        if (cat.includes('주거')) return 'text-cat-house';
        if (cat.includes('생활')) return 'text-cat-living';
        if (cat.includes('육아')) return 'text-cat-child';
        return 'text-cat-etc';
    };

    return (
        <section className="container mx-auto px-4 py-8 bg-gray-50 rounded-2xl my-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">분야별 최신 뉴스</h2>
            </div>

            <div className="flex flex-col divide-y divide-gray-200 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {selectedArticles.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-xl">
                        <div className="text-4xl mb-4">📂</div>
                        <p className="text-gray-500 font-medium">분야별 뉴스가 없습니다.</p>
                    </div>
                ) : (
                    selectedArticles.map((item) => (
                        <Link
                            key={item.id}
                            href={`/article/${item.id}`}
                            className="flex items-start md:items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                        >
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2 md:mb-1">
                                    <span className={`font-bold text-sm ${getCategoryTextColor(item.category)}`}>[{item.category}]</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-medium text-gray-800 group-hover:text-primary">
                                    {item.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-gray-400 text-sm hidden md:block">
                                    {new Date(item.created_at || item.date || new Date()).toLocaleString('ko-KR', {
                                        timeZone: 'Asia/Seoul',
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    })}
                                </span>
                                <div className="w-24 h-24 md:w-32 md:h-20 relative overflow-hidden rounded-lg flex-shrink-0 bg-gray-100 border border-gray-100">
                                    <SafeImage
                                        src={item.thumbnail}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        sizes="(max-width: 768px) 96px, 128px"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}
