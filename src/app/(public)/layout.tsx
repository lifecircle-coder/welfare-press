import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';

// Dynamically import non-critical components to reduce initial JS payload
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
const VisitTracker = dynamic(() => import('@/components/VisitTracker'), { ssr: false });

export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <VisitTracker />
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </>
    );
}
