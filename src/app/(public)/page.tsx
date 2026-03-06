import HeroSection from '@/components/home/HeroSection';
import LatestNews from '@/components/home/LatestNews';
import { getArticles, getHeroArticles } from '@/lib/services';

export const revalidate = 60; // 1분마다 캐시 갱신 (ISR)

export default async function Home() {
    // Parallelize core data fetching for faster server-side response
    const [heroArticles, latestArticles] = await Promise.all([
        getHeroArticles(),
        getArticles(10) // Only fetch top 10 for the "Latest" section initially
    ]);

    return (
        <div className="bg-white text-gray-900">
            <div className="py-6">
                <HeroSection articles={heroArticles} />
                <LatestNews articles={latestArticles} />
            </div>
        </div>
    );
}
