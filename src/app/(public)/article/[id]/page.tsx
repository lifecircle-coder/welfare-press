import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getArticleById, getArticles, getComments } from '@/lib/services';
import type { Article, Comment } from '@/lib/services';
import ViewCounter from '@/components/article/ViewCounter';

const CommentSection = dynamic(() => import('@/components/article/CommentSection'), {
    ssr: false,
    loading: () => <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />
});

// This allows the page to be cached and revalidated (ISR)
export const revalidate = 60;

// Pre-render pages at build time for instant loading (SSG)
export async function generateStaticParams() {
    const articles = await getArticles();
    return articles.map((article) => ({
        id: article.id,
    }));
}

export default async function ArticleDetail({ params }: { params: { id: string } }) {
    // Fetch data concurrently for maximum speed
    const [article, allArticles, initialComments] = await Promise.all([
        getArticleById(params.id),
        getArticles(),
        getComments(params.id)
    ]);

    if (!article) {
        return <div className="p-20 text-center">기사를 찾을 수 없습니다.</div>;
    }

    // Process related news after fetching
    const currentTags = article.hashtags || [];
    const relatedNews = allArticles.filter(a =>
        a.id !== params.id &&
        a.hashtags?.some(tag => currentTags.includes(tag))
    ).slice(0, 5);

    const getCategoryStyles = (cat: string) => {
        if (cat.includes('일자리')) return 'bg-cat-job/30 text-cat-job';
        if (cat.includes('건강')) return 'bg-cat-health/30 text-cat-health';
        if (cat.includes('주거')) return 'bg-cat-house/30 text-cat-house';
        if (cat.includes('생활')) return 'bg-cat-living/30 text-cat-living';
        if (cat.includes('육아')) return 'bg-cat-child/30 text-cat-child';
        return 'bg-cat-etc/30 text-cat-etc';
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Handle view increment on client side */}
            <ViewCounter articleId={params.id} />

            {/* Category Badge - Unified with thumbnail labels */}
            <span className={`inline-block ${getCategoryStyles(article.category)} px-3 py-1 rounded-full text-sm font-bold mb-4 shadow-sm backdrop-blur-sm`}>
                {article.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6 gap-y-2">
                <span className="font-medium text-gray-700 mr-4 whitespace-nowrap">{article.author}</span>

                <span className="mr-4">
                    {(() => {
                        const date = new Date(article.created_at || article.date || new Date());
                        return date.toLocaleString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                    })()}
                </span>
                <span>조회 {article.views}</span>
            </div>

            {/* AI Summary Box */}
            <div className="bg-gray-50 border-l-4 border-primary p-6 rounded-r-lg mb-10">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    🤖 AI 3줄 요약
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                    {article.summary}
                </p>
            </div>

            {/* Content Body */}
            <article
                className="prose prose-lg max-w-none text-gray-800 leading-loose prose-headings:font-bold prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            {/* Tags */}
            <div className="mt-10 flex gap-2 flex-wrap">
                {article.hashtags?.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
                        #{tag}
                    </span>
                ))}
            </div>

            {/* Related News */}
            <div className="mt-12 mb-16">
                <h3 className="text-xl font-bold text-gray-900 mb-4">관련 뉴스</h3>
                <ul className="space-y-3">
                    {relatedNews.length > 0 ? relatedNews.map(news => (
                        <li key={news.id}>
                            <Link href={`/article/${news.id}`} className="flex items-center justify-between group hover:bg-gray-50 p-3 rounded-lg transition-colors">
                                <span className="text-lg text-gray-700 group-hover:text-primary truncate flex-1 pr-4">{news.title}</span>
                                <span className="text-sm text-gray-400 whitespace-nowrap">{new Date(news.date || new Date()).toLocaleDateString()}</span>
                            </Link>
                        </li>
                    )) : (
                        <p className="text-gray-500">관련된 기사가 없습니다.</p>
                    )}
                </ul>
            </div>

            {/* Comment Section (Client Component) */}
            <CommentSection articleId={params.id} initialComments={initialComments} />
        </div>
    );
}
