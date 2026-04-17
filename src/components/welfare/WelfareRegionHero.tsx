'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Home, Sparkles, TrendingUp } from 'lucide-react';
import { WelfareRegion } from '@/lib/welfare-pseo';

interface Props {
    region: WelfareRegion;
}

export default function WelfareRegionHero({ region }: Props) {
    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

    return (
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-black tracking-widest uppercase mb-8">
                        <MapPin className="w-3.5 h-3.5" /> {region.name} 청년 라이프 가이드
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-8 max-w-4xl">
                        {region.name} 청년들을 위한<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">
                            2025 복지 로드맵
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl leading-relaxed font-medium">
                        {region.description}
                    </p>
                </motion.div>

                {/* Local Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { 
                            label: '청년 거주 인구', 
                            value: `${formatNumber(region.population_youth)}명`, 
                            sub: '안심하고 함께 사세요',
                            icon: <Users className="w-6 h-6" />,
                            color: 'blue' 
                        },
                        { 
                            label: '평균 오피스텔 월세', 
                            value: `약 ${formatNumber(Math.floor(region.avg_rent_officetel / 10000))}만원`, 
                            sub: '주거 지원 정책 필수!',
                            icon: <Home className="w-6 h-6" />,
                            color: 'emerald' 
                        },
                        { 
                            label: '최근 혜택 업데이트', 
                            value: '실시간', 
                            sub: '오늘도 새로운 소식',
                            icon: <TrendingUp className="w-6 h-6" />,
                            color: 'amber' 
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                                <p className="text-xs font-bold text-slate-400 opacity-70">{stat.sub}</p>
                            </div>
                            <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-400 border border-${stat.color}-500/20`}>
                                {stat.icon}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
