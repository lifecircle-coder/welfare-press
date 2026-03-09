import HeroSection from '@/components/home/HeroSection';
import LatestNews from '@/components/home/LatestNews';
import { getArticles, getHeroArticles } from '@/lib/services';

export const revalidate = 60; // 1분마다 캐시 갱신 (ISR)

export default async function Home() {
    // Fetch all latest articles to distribute between Hero and Latest sections
    const allArticles = await getArticles(100); // 총 100개까지 넉넉하게 가져옴

    // Top 3 for Section 1 (Hero)
    const heroArticles = allArticles.slice(0, 3);

    // Section 2 (LatestNews) gets the rest, excluding Section 1
    const latestArticles = allArticles.slice(3);

    return (
        <div className="bg-white text-gray-900">
            <div className="py-6">
                <HeroSection articles={heroArticles} />
                <LatestNews articles={latestArticles} />
            </div>
        </div>
    );
}
