'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, Car, Building2, ChevronRight, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function getEmployeeStatus(employee: any): 'active' | 'scheduled' | 'retired' {
    if (!employee.leaveDate) return 'active';

    // 日本時間(JST)の今日の日付（YYYY-MM-DD）を取得
    const jstOffset = 9 * 60 * 60 * 1000;
    const todayJST = new Date(Date.now() + jstOffset);
    const todayStr = todayJST.toISOString().split('T')[0];

    // 退職日の日付部分（YYYY-MM-DD）を取得
    const leaveDateStr = employee.leaveDate.split('T')[0];

    // 文字列の比較により、タイムゾーンや時間の丸め処理による境界ズレを防ぎます
    return leaveDateStr >= todayStr ? 'scheduled' : 'retired';
}

function isCurrentEmployee(employee: any) {
    const status = getEmployeeStatus(employee);
    return status === 'active' || status === 'scheduled';
}

export default function DashboardPage() {
    const [selectedAreaId, setSelectedAreaId] = useState<string>('10');
    const [selectedVehicleAreaId, setSelectedVehicleAreaId] = useState<string>('10');

    const { data: employees = [] } = useQuery<any[]>({
        queryKey: ['employees', { includeArchived: true }],
        queryFn: async () => (await fetch('/api/employees?includeArchived=true')).json(),
    });
    const { data: vehicles = [] } = useQuery<any[]>({
        queryKey: ['vehicles'],
        queryFn: async () => (await fetch('/api/vehicles')).json(),
    });
    const { data: contracts = [] } = useQuery<any[]>({
        queryKey: ['contracts'],
        queryFn: async () => (await fetch('/api/contracts')).json(),
    });

    // エリア一覧の取得
    const { data: areasData } = useQuery<any>({
        queryKey: ['staff-allocation-areas'],
        queryFn: async () => (await fetch('/api/dashboard/staff-allocation')).json(),
    });
    const areas = areasData?.areas || [];

    const { data: branchesData, isLoading: isLoadingBranches } = useQuery<any>({
        queryKey: ['staff-allocation-branches', selectedAreaId],
        queryFn: async () => (await fetch(`/api/dashboard/staff-allocation?areaId=${selectedAreaId}`)).json(),
        enabled: !!selectedAreaId,
    });
    const branches = branchesData?.branches || [];

    // 選択されたエリアの支社所属車両台数一覧の取得
    const { data: vehicleBranchesData, isLoading: isLoadingVehicleBranches } = useQuery<any>({
        queryKey: ['staff-allocation-branches-vehicle', selectedVehicleAreaId],
        queryFn: async () => (await fetch(`/api/dashboard/staff-allocation?areaId=${selectedVehicleAreaId}`)).json(),
        enabled: !!selectedVehicleAreaId,
    });
    const vehicleBranches = vehicleBranchesData?.branches || [];

    const activeEmployees = employees.filter((e: any) => isCurrentEmployee(e)).length;
    const totalAccidents = vehicles.reduce((s: number, v: any) => s + v.accidents.length, 0);
    const alertContracts = contracts.filter((c: any) => c.daysLeft <= 90);

    // Employee contract expiry alerts (fixed-term, within 60 days, no renewalPlanned)
    const expiringEmployees = employees
        .filter((e: any) => {
            if (!isCurrentEmployee(e)) return false; // 退職した人は除外
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
            </div>

            {/* 人員管理ダッシュボード */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-500" /> 人員管理
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">エリア:</span>
                            {areas.length > 0 ? (
                                <Select value={selectedAreaId} onValueChange={(val) => setSelectedAreaId(val ?? '')}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="エリアを選択">
                                            {areas.find((area: any) => area.id === selectedAreaId)?.name || ''}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areas.map((area: any) => (
                                            <SelectItem key={area.id} value={area.id}>
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm border rounded px-3 py-1 bg-background text-muted-foreground w-[140px] h-9 flex items-center justify-between">
                                    読み込み中...
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBranches ? (
                            <p className="text-sm text-muted-foreground text-center py-6">読み込み中...</p>
                        ) : branches.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">該当する支社はありません</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {branches.map((b: any) => (
                                    <Card key={b.id} className="bg-muted/30">
                                        <CardContent className="p-4 flex flex-col justify-between h-full">
                                            <p className="text-sm font-semibold text-foreground truncate" title={b.name}>
                                                {b.name}
                                            </p>
                                            <div className="mt-4 flex items-baseline gap-1">
                                                <span className="text-2xl font-bold">{b.manWeeks.toFixed(1)}</span>
                                                <span className="text-xs text-muted-foreground">人週</span>
                                                <span className="text-sm text-muted-foreground ml-2">/ {b.employeeCount}名</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* 車両管理ダッシュボード */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Car className="w-5 h-5 text-brand-500" /> 車両管理
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">エリア:</span>
                            {areas.length > 0 ? (
                                <Select value={selectedVehicleAreaId} onValueChange={(val) => setSelectedVehicleAreaId(val ?? '')}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="エリアを選択">
                                            {areas.find((area: any) => area.id === selectedVehicleAreaId)?.name || ''}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areas.map((area: any) => (
                                            <SelectItem key={area.id} value={area.id}>
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm border rounded px-3 py-1 bg-background text-muted-foreground w-[140px] h-9 flex items-center justify-between">
                                    読み込み中...
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingVehicleBranches ? (
                            <p className="text-sm text-muted-foreground text-center py-6">読み込み中...</p>
                        ) : vehicleBranches.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">該当する支社はありません</p>
                        ) : (
                            (() => {
                                // 日本標準時（JST）の本日の日付（YYYY-MM-DD）を取得
                                const today = new Date();
                                const todayStr = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        {vehicleBranches.map((b: any) => {
                                            // 支社に所属する車両の集計
                                            const branchVehicles = vehicles.filter((v: any) => v.branchId === b.id);
                                            
                                            // 修理中車両の集計
                                            const repairCount = branchVehicles.filter((v: any) => 
                                                v.inspections?.some((insp: any) => 
                                                    insp.inspectionStartDate && insp.inspectionStartDate <= todayStr &&
                                                    insp.inspectionEndDate && insp.inspectionEndDate >= todayStr
                                                )
                                            ).length;

                                            const activeCount = branchVehicles.length - repairCount;

                                            return (
                                                <Card key={b.id} className="bg-muted/30">
                                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                                        <p className="text-sm font-semibold text-foreground truncate" title={b.name}>
                                                            {b.name}
                                                        </p>
                                                        <div className="mt-4 flex flex-col gap-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-2xl font-bold">{activeCount}</span>
                                                                <span className="text-sm text-muted-foreground">/ {branchVehicles.length}台</span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">実働可能台数 / 保持台数</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
