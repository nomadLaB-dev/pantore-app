'use client';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, Car, Building2, ChevronRight, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FIXED_TERM_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';

function DaysLeftBadge({ days }: { days: number }) {
    if (days <= 30) return <span className="text-xs font-bold text-red-600 dark:text-red-400">残り{days}日</span>;
    if (days <= 60) return <span className="text-xs font-bold text-amber-600 dark:text-amber-400">残り{days}日</span>;
    if (days <= 90) return <span className="text-xs text-muted-foreground">残り{days}日</span>;
    return <span className="text-xs text-muted-foreground">残り{days}日</span>;
}

function daysUntil(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

export default function DashboardPage() {
    const { data: employees = [] } = useQuery<any[]>({
        queryKey: ['employees'],
        queryFn: async () => (await fetch('/api/employees')).json(),
    });
    const { data: vehicles = [] } = useQuery<any[]>({
        queryKey: ['vehicles'],
        queryFn: async () => (await fetch('/api/vehicles')).json(),
    });
    const { data: contracts = [] } = useQuery<any[]>({
        queryKey: ['contracts'],
        queryFn: async () => (await fetch('/api/contracts')).json(),
    });

    const activeEmployees = employees.filter((e: any) => !e.leaveDate).length;
    const totalAccidents = vehicles.reduce((s: number, v: any) => s + v.accidents.length, 0);
    const alertContracts = contracts.filter((c: any) => c.daysLeft <= 90);

    // Employee contract expiry alerts (fixed-term, within 60 days, no renewalPlanned)
    const expiringEmployees = employees
        .filter((e: any) => {
            if (!e.currentContractEnd || e.currentRenewalPlanned) return false;
            if (!FIXED_TERM_CATEGORIES.includes(e.currentEmploymentCategory)) return false;
            const days = daysUntil(e.currentContractEnd);
            return days >= 0 && days <= 60;
        })
        .map((e: any) => ({ ...e, daysLeft: daysUntil(e.currentContractEnd) }))
        .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

    const stats = [
        { label: '在籍社員', value: activeEmployees || '—', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: '管理車両', value: vehicles.length || '—', icon: Car, color: 'text-brand-500', bg: 'bg-brand-500/10' },
        { label: '管理物件', value: 3, icon: Building2, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { label: '事故件数 (累計)', value: totalAccidents, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
                <p className="text-muted-foreground text-sm">全体のリソース状況とアラートを確認します。</p>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card>
                            <CardContent className="pt-5 pb-4 flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Employee contract expiry alert */}
            {expiringEmployees.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-amber-300 dark:border-amber-700">
                        <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                社員 契約期限アラート
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full ml-1">
                                    {expiringEmployees.length}件
                                </span>
                            </CardTitle>
                            <Link href="/employees" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                                社員一覧 <ChevronRight className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border">
                                {expiringEmployees.map((e: any) => (
                                    <Link
                                        key={e.id}
                                        href={`/employees/${e.id}`}
                                        className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold',
                                                e.daysLeft <= 30 ? 'bg-red-500' : 'bg-amber-500',
                                            )}>
                                                {e.name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{e.name}</p>
                                                <p className="text-xs text-muted-foreground">{e.branch?.name ?? '—'} · {e.currentEmploymentCategory ? (e.currentEmploymentCategory === 'part_time' ? 'パート・アルバイト' : e.currentEmploymentCategory === 'contract' ? '契約社員' : '派遣社員') : '—'}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <DaysLeftBadge days={e.daysLeft} />
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(e.currentContractEnd).toLocaleDateString('ja-JP')}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                                更新予定に設定するとこのアラートは非表示になります。
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Contract alerts */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <Card className="h-full">
                        <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" /> 契約期限アラート
                            </CardTitle>
                            <Link href="/contracts" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                                すべて見る <ChevronRight className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {alertContracts.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">期限近くの契約はありません</p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {alertContracts.slice(0, 5).map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between py-3 gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{c.relatedName}</p>
                                                <p className="text-xs text-muted-foreground">{c.counterparty}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <DaysLeftBadge days={c.daysLeft} />
                                                <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.endDate).toLocaleDateString('ja-JP')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent accidents */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
                    <Card className="h-full">
                        <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Car className="w-4 h-4 text-muted-foreground" /> 最近の事故記録
                            </CardTitle>
                            <Link href="/vehicles" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                                車両一覧 <ChevronRight className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {vehicles.flatMap((v: any) => v.accidents.map((a: any) => ({ ...a, vehicleName: `${v.manufacturer} ${v.model}` }))).length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">事故の記録はありません</p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {vehicles.flatMap((v: any) => v.accidents.map((a: any) => ({ ...a, vehicleName: `${v.manufacturer} ${v.model}` }))).map((a: any) => (
                                        <div key={a.id} className="flex items-center gap-3 py-3">
                                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{a.vehicleName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">{new Date(a.accidentDate).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
