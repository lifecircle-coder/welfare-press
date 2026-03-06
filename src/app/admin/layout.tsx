'use client';

import AdminSidebar from '@/components/admin/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { adminSupabase } from '@/lib/supabaseClient';
import ForcePasswordChangeModal from '@/components/admin/ForcePasswordChangeModal';

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            // Check current path to avoid infinite redirect if already on login page
            // (Though AdminLayout is usually for children of /admin excluding /admin/login if it's outside)
            if (pathname === '/admin/login') {
                setIsAuthorized(true);
                return;
            }

            const { data: { session } } = await adminSupabase.auth.getSession();

            if (!session?.user) {
                router.push('/admin/login');
                return;
            }

            if (session.user.user_metadata?.needs_password_change) {
                setNeedsPasswordChange(true);
            }

            setIsAuthorized(true);
        };

        checkAuth();
    }, [router, pathname]);

    if (!isAuthorized) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">인증 확인 중...</div>;
    }

    // 로그인 페이지인 경우 사이드바 없이 렌더링
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            {needsPasswordChange && (
                <ForcePasswordChangeModal onSuccess={() => setNeedsPasswordChange(false)} />
            )}
            <AdminSidebar />
            <main className="flex-1 ml-64 p-8 relative">
                {children}
            </main>
        </div>
    );
}
