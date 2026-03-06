import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VisitTracker from '@/components/VisitTracker';

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
