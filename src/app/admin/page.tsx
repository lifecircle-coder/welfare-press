'use client';

import { BarChart, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStats, getArticles, getWeeklyStats } from '@/lib/services';
import type { Article } from '@/lib/services';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalVisitors: 0, totalArticles: 0, pendingInquiries: 0 });
    const [topArticles, setTopArticles] = useState<Article[]>([]);
    const [categoryDist, setCategoryDist] = useState<{ cat: string; percent: number; color: string }[]>([]);
    const [weeklyStats, setWeeklyStats] = useState<{ day: string; val: number; date: string }[]>([]);

    useEffect(() => {
        async function loadDashboard() {
            // Check session and redirect if reporter
            const { data: { session } } = await adminSupabase.auth.getSession();
            if (session?.user?.user_metadata?.role === 'reporter') {
                router.replace('/admin/articles');
                return;
            }

            const statsData = await getStats();
            setStats(statsData);

            const articlesData = await getArticles();
            const sorted = articlesData.sort((a, b) => b.views - a.views).slice(0, 5); // Top 5
            setTopArticles(sorted);

            // Calculate Category Distribution
            const catCounts: Record<string, number> = {};
            articlesData.forEach(a => {
                const cat = a.category || '기타';
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            });
            const total = articlesData.length;
            const dist = Object.entries(catCounts)
                .map(([cat, count], i) => ({
                    cat,
                    percent: Math.round((count / total) * 100),
                    color: ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'][i % 6]
                }))
                .sort((a, b) => b.percent - a.percent); // Show all categories
            setCategoryDist(dist);

            // Weekly Stats
            const weeklyData = await getWeeklyStats();
            // Fill in missing days for the last 7 days if DB doesn't have them
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - (6 - i));
                return d;
            });

            const formattedWeekly = last7Days.map(date => {
                const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                const found = weeklyData.find((w: any) => w.date === dateStr);
                return {
                    day: days[date.getDay()],
                    date: `${date.getMonth() + 1}.${date.getDate()}`,
                    val: found ? found.count : 0
                };
            });
            setWeeklyStats(formattedWeekly);
        }
        loadDashboard();
    }, [router]);

    // Helper to normalize bar height (max value = 100%)
    // Helper to normalize bar height (max value = 100%)
    const maxVal = Math.max(...weeklyStats.map(d => Number(d.val)), 10); // min max 10 to avoid div by zero

    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="총 방문자 (조회수 합계)" value={stats.totalVisitors.toLocaleString()} change="-" color="blue" />
                <StatCard title="총 기사 수" value={stats.totalArticles.toLocaleString()} change="-" color="green" />
                <StatCard
                    title="미답변 문의"
                    value={stats.pendingInquiries.toString()}
                    change={stats.pendingInquiries > 0 ? "주의" : "양호"}
                    color={stats.pendingInquiries > 0 ? "red" : "green"}
                />
            </div>

            {/* Charts & Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* Weekly Visitor Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart size={18} className="text-primary" />
                            주간 방문자 추이
                        </h3>
                        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <div className="px-3 py-1 text-xs text-gray-500 font-medium">
                                {weeklyStats.length > 0 && `${weeklyStats[0].date} ~ ${weeklyStats[weeklyStats.length - 1].date}`}
                            </div>
                        </div>
                    </div>

                    {/* Chart Visualization */}
                    <div className="h-64 flex justify-between gap-2 px-2">
                        {weeklyStats.map((d, i) => (
                            <div key={i} className="h-full flex flex-col justify-end items-center gap-2 flex-1 group">
                                <div className="text-xs font-bold text-gray-500 mb-1">{Number(d.val)}</div>
                                <div
                                    className={`w-full rounded-t-lg transition-colors relative ${i === 6 ? 'bg-primary' : 'bg-blue-100 group-hover:bg-blue-300'}`}
                                    style={{ height: `${(Number(d.val) / maxVal) * 80}%`, minHeight: '4px' }}
                                >
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className={`text-xs font-bold ${i === 6 ? 'text-primary' : 'text-gray-500'}`}>{d.day}</span>
                                    <span className="text-[10px] text-gray-400">{d.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Article Analytics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ArrowUpRight size={18} className="text-green-600" />
                        기사 분석
                    </h3>

                    {/* Category Distribution */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-600 mb-4">카테고리별 인기 분포</h4>
                        <div className="space-y-3">
                            {categoryDist.map(c => (
                                <div key={c.cat}>
                                    <div className="flex justify-between text-xs font-bold mb-1 text-gray-600">
                                        <span>{c.cat}</span>
                                        <span>{c.percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className={`h-full ${c.color}`} style={{ width: `${c.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Views Ranking */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-600 mb-4">기사 조회수 랭킹 TOP 5</h4>
                        <ul className="space-y-3">
                            {topArticles.map((article, index) => (
                                <li key={article.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                                        }`}>{index + 1}</span>
                                    <div className="flex-1 truncate">
                                        <div className="text-sm font-bold text-gray-900 truncate">{article.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{article.category} · 조회수 {article.views.toLocaleString()}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({ title, value, change, color }: { title: string, value: string, change: string, color: string }) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        red: 'text-red-600 bg-red-50',
    }[color] || 'text-gray-600 bg-gray-50';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold mb-2">{title}</h3>
            <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-gray-900">{value}</span>
                <span className={`text-sm font-bold px-2 py-1 rounded ${colorClasses}`}>
                    {change}
                </span>
            </div>
        </div>
    );
}
