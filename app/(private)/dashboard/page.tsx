'use client';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, Car, HardHat, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
    const stats = [
        { label: '総社員数', value: '142', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: '稼働率', value: '94%', icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-100 dark:bg-brand-900/30' },
        { label: '管理車両数', value: '38', icon: Car, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        { label: '今月の事故', value: '2', icon: HardHat, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
                <p className="text-slate-500 dark:text-slate-400">全体のリソース状況とアラートを確認します。</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-border shadow-sm flex items-center gap-4"
                    >
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-border shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            契約期限アラート
                        </h3>
                        <button className="text-sm font-medium text-brand-500 hover:text-brand-600">すべて見る</button>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <div>
                                        <p className="font-medium text-sm">車両リース契約 (品川300 あ 1234)</p>
                                        <p className="text-xs text-slate-500">オリックス自動車</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-500">残り14日</p>
                                    <p className="text-xs text-slate-500">2026-04-24</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-border shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            稼働調整が必要な社員
                        </h3>
                    </div>
                    <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                        <p>現在アラート対象の社員はいません。</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
