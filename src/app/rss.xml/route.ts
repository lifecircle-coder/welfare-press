import { getArticles } from '@/lib/services';

const BASE_URL = 'https://thebok.co.kr';

export const revalidate = 3600; // 1시간마다 캐시 갱신

export async function GET() {
    try {
        const articles = await getArticles(50); // 최신 50건 가져오기

        const items = articles.map(article => {
            const url = `${BASE_URL}/article/${article.id}`;
            // HTML 태그 제거 및 요약 생성
            const description = article.summary || 
                               article.content?.replace(/<[^>]*>/g, '').substring(0, 200) || 
                               '';
            const pubDate = new Date(article.date || article.created_at || new Date()).toUTCString();

            return `
        <item>
            <title><![CDATA[${article.title}]]></title>
            <link>${url}</link>
            <description><![CDATA[${description}]]></description>
            <pubDate>${pubDate}</pubDate>
            <guid isPermaLink="false">${article.id}</guid>
            <author><![CDATA[${article.author || 'THE 복지'}]]></author>
            <category><![CDATA[${article.category}]]></category>
        </item>`;
        }).join('');

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
    <title>THE 복(福)지 : 복지신문</title>
    <link>${BASE_URL}</link>
    <description>전국민을 위한 맞춤형 복지 정책 및 뉴스 정보 서비스</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
</channel>
</rss>`;

        return new Response(rss, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
            },
        });
    } catch (error) {
        console.error('RSS 생성 오류:', error);
        return new Response('RSS Generation Error', { status: 500 });
    }
}
