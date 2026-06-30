'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, Car, Building2, ChevronRight, UserCheck, PlayCircle, Coffee, RefreshCw, CheckSquare, CalendarDays, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIXED_TERM_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import type { AttendanceStatus } from '@/types';

function TodayScheduleSummary() {
    const supabase = createClient();
    const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: schedules = [], isLoading } = useQuery<any[]>({
        queryKey: ['today-schedules', todayJST],
        queryFn: async () => {
            const { data } = await supabase
                .from('schedules')
                .select('id, system_type, area, facility_name, collect_time')
                .eq('collect_date', todayJST)
                .eq('is_archived', false)
                .order('collect_time', { ascending: true });
            return data ?? [];
        },
    });

    const typeLabels: Record<string, string> = { M: 'MDF', Q: 'Q-dome', IP: 'IPD', I: 'Inter', F: 'Fedex' };
    const byType: Record<string, number> = {};
    schedules.forEach((s: any) => {
        const t = s.system_type || '—';
        byType[t] = (byType[t] || 0) + 1;
    });

    return (
        <Card className="h-full">
            <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    今日の集配送予定
                    {!isLoading && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full ml-1">
                            {schedules.length}件
                        </span>
                    )}
                </CardTitle>
                <Link href="/schedules" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                    すべて見る <ChevronRight className="w-3 h-3" />
                </Link>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">読み込み中...</p>
                ) : schedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">本日の集配送予定はありません</p>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Object.entries(byType).map(([type, count]) => (
                                <span key={type} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full">
                                    {typeLabels[type] ?? type}
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{count}</span>
                                </span>
                            ))}
                        </div>
                        <div className="divide-y divide-border">
                            {schedules.slice(0, 6).map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between py-2.5 gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{s.facility_name || '—'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{s.area || '—'}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs font-mono text-foreground">{s.collect_time || '—'}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{typeLabels[s.system_type] ?? s.system_type ?? '—'}</p>
                                    </div>
                                </div>
                            ))}
                            {schedules.length > 6 && (
                                <p className="text-xs text-muted-foreground text-center pt-2.5">他 {schedules.length - 6} 件</p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function DriverActivityOverview() {
    const supabase = createClient();

    const { data, isLoading } = useQuery<{ drivers: any[]; attendance: any[] }>({
        queryKey: ['driver-activity'],
        queryFn: async () => {
            const [driverRes, attendanceRes] = await Promise.all([
                supabase.from('users').select('id, name').eq('specimen_role', 'driver').order('name'),
                supabase.from('attendance_records').select('employee_id, status, last_updated'),
            ]);
            return { drivers: driverRes.data ?? [], attendance: attendanceRes.data ?? [] };
        },
        refetchInterval: 30_000,
    });

    const drivers = data?.drivers ?? [];
    const attendanceMap = Object.fromEntries((data?.attendance ?? []).map((a: any) => [a.employee_id, a]));
    const getStatus = (id: string): string => attendanceMap[id]?.status ?? 'not_started';

    const statusConfig: Record<string, { label: string; dot: string; text: string; count: string }> = {
        working:     { label: '勤務中', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400', count: 'text-green-600 dark:text-green-400' },
        on_break:    { label: '休憩中', dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400', count: 'text-amber-600 dark:text-amber-400' },
        not_started: { label: '未出勤', dot: 'bg-slate-300', text: 'text-slate-500 dark:text-slate-400', count: 'text-slate-500' },
        finished:    { label: '退勤済', dot: 'bg-blue-400',  text: 'text-blue-700 dark:text-blue-400',  count: 'text-blue-600 dark:text-blue-400' },
    };

    const counts: Record<string, number> = { working: 0, on_break: 0, not_started: 0, finished: 0 };
    drivers.forEach(d => { const s = getStatus(d.id); counts[s] = (counts[s] ?? 0) + 1; });

    return (
        <Card className="h-full">
            <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" />
                    ドライバー稼働状況
                    <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full ml-1">
                        計 {drivers.length} 名
                    </span>
                </CardTitle>
                <Link href="/attendance" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                    詳細 <ChevronRight className="w-3 h-3" />
                </Link>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">読み込み中...</p>
                ) : drivers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">ドライバーが登録されていません</p>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {(['working', 'on_break', 'not_started', 'finished'] as const).map((key) => (
                                <div key={key} className="text-center p-3 bg-muted/40 rounded-xl">
                                    <p className={`text-2xl font-bold ${statusConfig[key].count}`}>{counts[key] ?? 0}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{statusConfig[key].label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="divide-y divide-border max-h-48 overflow-y-auto">
                            {drivers.map((d: any) => {
                                const s = getStatus(d.id);
                                const cfg = statusConfig[s] ?? statusConfig.not_started;
                                return (
                                    <div key={d.id} className="flex items-center justify-between py-2.5 gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                                                {d.name?.[0] ?? '?'}
                                            </div>
                                            <p className="text-sm font-medium truncate">{d.name}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function DriverDashboard() {
    const supabase = createClient();
    const [status, setStatus] = useState<AttendanceStatus>('not_started');
    const [updating, setUpdating] = useState(false);

    const statusConfig: Record<AttendanceStatus, { label: string; next: AttendanceStatus; nextLabel: string; color: string; icon: React.ElementType }> = {
        not_started: { label: '未出勤', next: 'working', nextLabel: '出勤する', color: 'bg-slate-100 text-slate-700', icon: PlayCircle },
        working: { label: '勤務中', next: 'on_break', nextLabel: '休憩する', color: 'bg-green-100 text-green-700', icon: Coffee },
        on_break: { label: '休憩中', next: 'working', nextLabel: '業務再開', color: 'bg-amber-100 text-amber-700', icon: RefreshCw },
        finished: { label: '退勤済', next: 'finished', nextLabel: '退勤完了', color: 'bg-blue-100 text-blue-700', icon: CheckSquare },
    };

    const current = statusConfig[status];

    const handleStatusChange = async (nextStatus: AttendanceStatus) => {
        setUpdating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: emp } = await supabase.from('users').select('id, tenant_id').eq('user_id', user.id).single();
            if (!emp) return;
            await supabase.from('attendance_records').upsert({
                employee_id: emp.id,
                tenant_id: emp.tenant_id,
                status: nextStatus,
                time: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            }, { onConflict: 'employee_id' });
            setStatus(nextStatus);
        } finally { setUpdating(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">出勤タイムカード</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-8">
                    <div className={`px-6 py-3 rounded-full text-lg font-bold ${current.color}`}>
                        {current.label}
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                        {status !== 'finished' && (
                            <button
                                onClick={() => handleStatusChange(current.next)}
                                disabled={updating}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                            >
                                <current.icon size={18} />
                                {current.nextLabel}
                            </button>
                        )}
                        {status === 'working' && (
                            <button
                                onClick={() => handleStatusChange('finished')}
                                disabled={updating}
                                className="flex items-center gap-2 px-8 py-3 bg-slate-700 text-white rounded-xl font-semibold text-base hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-md"
                            >
                                <CheckSquare size={18} />
                                退勤する
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

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
    const { specimenRole } = useAppStore();
    const [activeTab, setActiveTab] = useState<'erp' | 'specimen'>('erp');
    const [selectedAreaId, setSelectedAreaId] = useState<string>('10');
    const [selectedVehicleAreaId, setSelectedVehicleAreaId] = useState<string>('10');

    const { data: employees = [] } = useQuery<any[]>({
        queryKey: ['users', { includeArchived: true }],
        queryFn: async () => (await fetch('/api/users?includeArchived=true')).json(),
    });
    const { data: vehicles = [] } = useQuery<any[]>({
        queryKey: ['vehicles'],
        queryFn: async () => (await fetch('/api/vehicles')).json(),
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
            {/* ヘッダー + タブ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
                    <p className="text-muted-foreground text-sm">全体のリソース状況とアラートを確認します。</p>
                </div>
                <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit shrink-0">
                    <button
                        onClick={() => setActiveTab('erp')}
                        className={cn(
                            'px-5 py-2 text-sm font-medium rounded-lg transition-all',
                            activeTab === 'erp'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        ERP
                    </button>
                    <button
                        onClick={() => setActiveTab('specimen')}
                        className={cn(
                            'px-5 py-2 text-sm font-medium rounded-lg transition-all',
                            activeTab === 'specimen'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        検体管理
                    </button>
                </div>
            </div>

            {/* ── ERP タブ ── */}
            {activeTab === 'erp' && (
                <>
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

                    {/* 社員 契約期限アラート */}
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
                                    <Link href="/users" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                                        社員一覧 <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y divide-border">
                                        {expiringEmployees.map((e: any) => (
                                            <Link key={e.id} href={`/users/${e.id}`} className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold', e.daysLeft <= 30 ? 'bg-red-500' : 'bg-amber-500')}>
                                                        {e.name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{e.name}</p>
                                                        <p className="text-xs text-muted-foreground">{e.branch?.name ?? '—'} · {e.currentEmploymentCategory === 'part_time' ? 'パート・アルバイト' : e.currentEmploymentCategory === 'contract' ? '契約社員' : '派遣社員'}</p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <DaysLeftBadge days={e.daysLeft} />
                                                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.currentContractEnd).toLocaleDateString('ja-JP')}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">更新予定に設定するとこのアラートは非表示になります。</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* 人員管理 */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
                                                <SelectValue placeholder="エリアを選択">{areas.find((a: any) => a.id === selectedAreaId)?.name || ''}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {areas.map((area: any) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-sm border rounded px-3 py-1 bg-background text-muted-foreground w-[140px] h-9 flex items-center">読み込み中...</div>
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
                                                    <p className="text-sm font-semibold text-foreground truncate" title={b.name}>{b.name}</p>
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

                    {/* 車両管理 */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
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
                                                <SelectValue placeholder="エリアを選択">{areas.find((a: any) => a.id === selectedVehicleAreaId)?.name || ''}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {areas.map((area: any) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-sm border rounded px-3 py-1 bg-background text-muted-foreground w-[140px] h-9 flex items-center">読み込み中...</div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingVehicleBranches ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">読み込み中...</p>
                                ) : vehicleBranches.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">該当する支社はありません</p>
                                ) : (() => {
                                    const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {vehicleBranches.map((b: any) => {
                                                const branchVehicles = vehicles.filter((v: any) => v.branchId === b.id);
                                                const repairCount = branchVehicles.filter((v: any) =>
                                                    v.inspections?.some((insp: any) =>
                                                        insp.inspectionStartDate <= todayStr && insp.inspectionEndDate >= todayStr
                                                    )
                                                ).length;
                                                return (
                                                    <Card key={b.id} className="bg-muted/30">
                                                        <CardContent className="p-4 flex flex-col justify-between h-full">
                                                            <p className="text-sm font-semibold text-foreground truncate" title={b.name}>{b.name}</p>
                                                            <div className="mt-4 flex flex-col gap-1">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-2xl font-bold">{branchVehicles.length - repairCount}</span>
                                                                    <span className="text-sm text-muted-foreground">/ {branchVehicles.length}台</span>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground">実働可能 / 保持台数</p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}

            {/* ── 検体管理 タブ ── */}
            {activeTab === 'specimen' && (
                <>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <TodayScheduleSummary />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <DriverActivityOverview />
                        </motion.div>
                    </div>

                    {/* ドライバー: 打刻カード */}
                    {specimenRole === 'driver' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <DriverDashboard />
                        </motion.div>
                    )}

                    {/* クイックリンク */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">クイックリンク</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Link href="/schedules" className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                    <CalendarDays className="w-4 h-4" /> スケジュール一覧
                                </Link>
                                <Link href="/data-entry" className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    データ入力
                                </Link>
                                <Link href="/attendance" className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl font-semibold text-sm hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                                    <Truck className="w-4 h-4" /> 出勤管理
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </div>
    );
}

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
