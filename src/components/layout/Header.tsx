'use client';

import Link from 'next/link';
import { Search, Menu, ZoomIn, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // Handle navigation progress bar
    useEffect(() => {
        setIsNavigating(false);
    }, [pathname]);

    useEffect(() => {
        // Check for active session on load
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userObj = {
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '회원',
                    email: session.user.email,
                    role: 'user', // Default mock role or fetch from db
                };
                setCurrentUser(userObj);
                localStorage.setItem('user', JSON.stringify(userObj));
            } else {
                setCurrentUser(null);
                localStorage.removeItem('user');
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                const userObj = {
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '회원',
                    email: session.user.email,
                    role: 'user',
                };
                setCurrentUser(userObj);
                localStorage.setItem('user', JSON.stringify(userObj));
            } else {
                setCurrentUser(null);
                localStorage.removeItem('user');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);



    const handleMenuClick = (href: string) => {
        if (href === pathname) return;
        setIsNavigating(true);
        setIsMenuOpen(false);
    };

    const menuItems = [
        { name: '종합', href: '/news/all' },
        { name: '건강·의료', href: '/news/health' },
        { name: '임신·육아', href: '/news/childcare' },
        { name: '일자리·취업', href: '/news/jobs' },
        { name: '생활·안전', href: '/news/safety' },
        { name: '주거·금융', href: '/news/housing' },
    ];

    // Text Size Toggle
    const toggleTextSize = () => {
        document.documentElement.classList.toggle('text-lg-mode');
    };

    // Search Handler
    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            localStorage.removeItem('user');
            router.push('/');
        }
    };

    return (
        <>
            <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
                {/* Navigation Progress Bar */}
                {isNavigating && (
                    <div className="fixed top-0 left-0 h-1 bg-primary z-[60] animate-progress shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                )}
                {/* Top Bar */}
                <div className="bg-gray-50 border-b border-gray-100 py-2">
                    <div className="container mx-auto px-4 flex justify-between items-center text-sm text-gray-600">
                        <div className="font-medium">{today}</div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTextSize}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                                <ZoomIn size={14} />
                                <span>글자 크게</span>
                            </button>
                            {currentUser ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/mypage"
                                        className="flex items-center gap-1 text-gray-900 font-bold hover:text-primary transition-colors"
                                    >
                                        <User size={14} className="text-gray-500" />
                                        {currentUser.name}님
                                    </Link>
                                    <span className="text-gray-200">|</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-400 hover:text-red-500 transition-colors font-medium"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-1 bg-gray-200 hover:bg-primary hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-all"
                                >
                                    <User size={12} />
                                    로그인
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Header (Logo & Search) */}
                <div className="container mx-auto px-4 py-4 flex justify-between items-center relative">
                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Logo */}
                    <Link href="/" className="text-2xl md:text-3xl font-bold text-primary tracking-tight absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none md:left-auto">
                        THE 복
                    </Link>

                    {/* Desktop Search Bar */}
                    <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-80 lg:w-96 focus-within:ring-2 focus-within:ring-primary transition-all">
                        <button onClick={handleSearch}>
                            <Search size={18} className="text-gray-400 mr-2 hover:text-primary" />
                        </button>
                        <input
                            type="text"
                            placeholder="검색어를 입력하세요..."
                            className="bg-transparent border-none outline-none text-gray-700 w-full text-sm placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {/* Mobile Search Icon */}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        <Search size={24} />
                    </button>
                </div>

                {/* Mobile Search Input (Visible when toggled) */}
                {isSearchOpen && (
                    <div className="md:hidden px-4 pb-4">
                        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 w-full">
                            <input
                                type="text"
                                placeholder="검색어를 입력하세요..."
                                className="bg-transparent border-none outline-none text-gray-700 w-full text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button onClick={handleSearch}>
                                <Search size={18} className="text-primary" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Navigation (Desktop) */}
                <nav className="hidden md:block border-t border-gray-100">
                    <div className="container mx-auto px-4">
                        <ul className="flex items-center justify-center gap-8 py-3 font-medium text-lg text-gray-800">
                            {menuItems.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => handleMenuClick(item.href)}
                                        className="hover:text-primary transition-colors py-2 block"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white md:hidden pt-20 px-4">
                    <ul className="space-y-4 text-xl font-bold text-gray-800">
                        {menuItems.map((item) => (
                            <li key={item.name} className="border-b border-gray-100 pb-2">
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block hover:text-primary"
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </>
    );
}
