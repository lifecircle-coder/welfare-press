import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next'
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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const article = await getArticleById(params.id);

    if (!article) {
        return {
            title: '기사를 찾을 수 없습니다',
        };
    }

    const title = article.title;
    const description = article.summary || article.content?.substring(0, 160).replace(/<[^>]*>/g, '') || '';
    const imageUrl = article.thumbnail || 'https://thebok.co.kr/logo.svg';

    return {
        title: title,
        description: description,
        alternates: {
            canonical: `/article/${article.id}`,
        },
        openGraph: {
            title: title,
            description: description,
            url: `https://thebok.co.kr/article/${article.id}`,
            type: 'article',
            publishedTime: article.created_at || article.date,
            authors: [article.author || 'THE 복지'],
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
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
        if (cat.includes('일자리')) return 'bg-cat-job text-white border-cat-job/10';
        if (cat.includes('건강')) return 'bg-cat-health text-white border-cat-health/10';
        if (cat.includes('주거')) return 'bg-cat-house text-white border-cat-house/10';
        if (cat.includes('생활')) return 'bg-cat-living text-white border-cat-living/10';
        if (cat.includes('육아')) return 'bg-cat-child text-white border-cat-child/10';
        return 'bg-cat-etc text-white border-cat-etc/10';
    };

    // Category Slug Mapping for Breadcrumb
    const slugMap: Record<string, string> = {
        '일자리·취업': 'jobs',
        '주거·금융': 'housing',
        '건강·의료': 'health',
        '생활·안전': 'safety',
        '임신·육아': 'childcare',
        '종합': 'all'
    };
    const categorySlug = slugMap[article.category] || encodeURIComponent(article.category);

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Category Badges & Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    {article.category_list && article.category_list.length > 0 ? (
                        article.category_list.map((cat, idx) => (
                            <div key={`${cat.category}-${cat.prefix}-${idx}`} className="flex items-center gap-1">
                                <span className={`inline-block ${getCategoryStyles(cat.category)} px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border`}>
                                    {cat.category}
                                </span>
                                <span className="inline-block bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-800">
                                    {cat.prefix}
                                </span>
                            </div>
                        ))
                    ) : (
                        <>
                            <span className={`inline-block ${getCategoryStyles(article.category)} px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border`}>
                                {article.category}
                            </span>
                            {article.prefix && (
                                <span className="inline-block bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-800">
                                    {article.prefix}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Breadcrumbs - Right Aligned & Simple */}
                <nav className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400">
                    <Link href="/" className="hover:text-primary transition-colors flex items-center">
                        <span className="sr-only">홈</span>
                        🏠
                    </Link>
                    <span className="text-gray-300">/</span>
                    <Link href={`/news/${categorySlug}`} className="hover:text-primary transition-colors">
                        {article.category}
                    </Link>
                    {article.prefix && (
                        <>
                            <span className="text-gray-300">/</span>
                            <Link 
                                href={`/news/${categorySlug}?prefix=${encodeURIComponent(article.prefix)}`} 
                                className="hover:text-primary transition-colors font-bold text-gray-500"
                            >
                                {article.prefix}
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            {/* JSON-LD Structured Data for NewsArticle */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "NewsArticle",
                        "headline": article.title,
                        "description": article.summary,
                        "image": [
                            article.thumbnail || "https://thebok.co.kr/logo.svg"
                        ],
                        "datePublished": article.created_at || article.date,
                        "dateModified": article.updated_at || article.created_at || article.date,
                        "author": [{
                            "@type": "Person",
                            "name": article.author || "THE 복지 기자"
                        }]
                    })
                }}
            />

            {/* Handle view increment on client side */}
            <ViewCounter articleId={params.id} />

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6 gap-y-2">
                <span className="font-medium text-gray-700 mr-6 whitespace-nowrap">{article.author}</span>

                <span className="mr-6 flex items-center gap-2">
                    <span className="font-semibold text-gray-400">발행일</span>
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

                <span className="flex items-center gap-2">
                    <span className="font-semibold text-gray-400">업데이트일</span>
                    {(() => {
                        const date = new Date(article.updated_at || article.created_at || article.date || new Date());
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
            </div>

            {/* AI Summary Box */}
            <div className="bg-gray-50 border-l-4 border-primary p-6 rounded-r-lg mb-10">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    🤖 AI 기사 요약
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
