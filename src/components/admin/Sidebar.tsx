'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, FileText, Users, MessageSquare, Home, LogOut, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/services';
import { adminSupabase } from '@/lib/supabaseClient';

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [pendingCount, setPendingCount] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch session and role
            const { data: { session } } = await adminSupabase.auth.getSession();
            if (session?.user) {
                // Check metadata first
                const role = session.user.user_metadata?.role;
                if (role) {
                    setUserRole(role);
                } else {
                    // Fallback to public.users table if not in metadata
                    const { data: userData } = await adminSupabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    if (userData) setUserRole(userData.role);
                }
            }

            const stats = await getStats();
            setPendingCount(stats.pendingInquiries);
        };
        fetchData();
    }, []);

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
    const isReporter = userRole === 'reporter';

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await adminSupabase.auth.signOut();
            localStorage.removeItem('user');
            router.push('/admin/login');
        }
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 left-0 top-0">
            <div className="p-6 border-b border-gray-100">
                <Link href="/admin">
                    <h1 className="text-2xl font-bold text-primary">관리자</h1>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {!isReporter && (
                    <NavItem
                        href="/admin"
                        icon={<BarChart size={20} />}
                        label="대시보드"
                        active={pathname === '/admin'}
                    />
                )}
                <NavItem
                    href="/admin/articles"
                    icon={<FileText size={20} />}
                    label="기사 관리"
                    active={isActive('/admin/articles')}
                />
                <NavItem
                    href="/admin/users"
                    icon={<Users size={20} />}
                    label="회원 관리"
                    active={isActive('/admin/users')}
                />
                {!isReporter && (
                    <NavItem
                        href="/admin/inquiries"
                        icon={<MessageSquare size={20} />}
                        label="문의 관리"
                        active={isActive('/admin/inquiries')}
                        badge={pendingCount > 0 ? pendingCount.toString() : undefined}
                    />
                )}
                {!isReporter && (
                    <NavItem
                        href="/admin/partnerships"
                        icon={<Mail size={20} />}
                        label="광고/제휴 문의"
                        active={isActive('/admin/partnerships')}
                    />
                )}
            </nav>
            <div className="p-4 border-t border-gray-100 space-y-2">
                <div className="mb-2 px-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {isReporter ? '기자 계정' : '최고 관리자'}
                </div>
                <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-2 text-gray-500 hover:text-primary hover:bg-blue-50 px-4 py-3 rounded-xl transition-all font-bold text-sm"
                >
                    <Home size={20} />
                    <span>홈페이지 바로가기</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl transition-all font-bold text-sm"
                >
                    <LogOut size={20} />
                    <span>로그아웃</span>
                </button>
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label, active, badge }: { href: string, icon: any, label: string, active?: boolean, badge?: string }) {
    return (
        <Link
            href={href}
            className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
        >
            <div className="flex items-center gap-3 font-medium">
                {icon}
                <span>{label}</span>
            </div>
            {badge && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                    {badge}
                </span>
            )}
        </Link>
    );
}
