import HeroSection from '@/components/home/HeroSection';
import LatestNews from '@/components/home/LatestNews';

export default function Home() {
    return (
        <div className="bg-white text-gray-900">
            <div className="py-6">
                <HeroSection />
                <LatestNews />
            </div>
        </div>
    );
}
