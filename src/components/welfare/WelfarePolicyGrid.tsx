'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WelfarePolicy } from '@/lib/welfare-pseo';
import { ArrowRight, Sparkles, Zap, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';

interface Props {
    policies: WelfarePolicy[];
}

export default function WelfarePolicyGrid({ policies }: Props) {
    if (policies.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black">아직 등록된 전용 정책이 없습니다. 곧 업데이트됩니다!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {policies.map((policy, i) => (
                <motion.div
                    key={policy.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
                >
                    {/* MZ AI Score Badge */}
                    <div className="absolute top-6 right-8 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                            MZ SCORE {policy.ai_score}/10
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                            {policy.category}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tighter">
                            {policy.source === 'NATIONAL' ? '국가공통' : '지역전용'}
                        </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                        {policy.title}
                    </h3>
                    
                    <p className="text-slate-500 font-medium leading-relaxed line-clamp-2 mb-8">
                        {policy.content_summary}
                    </p>

                    {/* Benefit Info */}
                    <div className="space-y-4 mb-10 pt-6 border-t border-slate-50">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Heart className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대상</p>
                                <p className="text-sm font-bold text-slate-700">{policy.eligibility}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">혜택</p>
                                <p className="text-sm font-bold text-slate-700">{policy.benefits}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-bold">{policy.deadline_text}</span>
                        </div>
                        <Link 
                            href={`/welfare/${policy.id}`} 
                            className="inline-flex items-center justify-center w-10 h-10 bg-slate-900 text-white rounded-2xl group-hover:bg-blue-600 transition-all duration-300 transform group-hover:rotate-[-10deg]"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
