'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Activity, History, CalendarDays, Edit3, UserCheck, UserX, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmploymentCategoryLabel, AccountStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
    full_time: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    part_time: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    contract: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    dispatch: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
};

const accountStatusConfig: Record<AccountStatus, { label: string; className: string }> = {
    active: { label: 'アカウント有効', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    disabled: { label: 'アカウント無効', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
    none: { label: '未発行', className: 'bg-transparent border border-border text-muted-foreground' },
};

const TABS = [
    { id: 'workload', name: '人月・稼働履歴', icon: Activity },
    { id: 'employment', name: '雇用区分履歴', icon: Briefcase },
    { id: 'shifts', name: 'シフト', icon: CalendarDays },
    { id: 'history', name: '異動・資産履歴', icon: History },
] as const;

type TabId = typeof TABS[number]['id'];

export default function EmployeeDetailPage() {
    const { id } = useParams() as { id: string };
    const [activeTab, setActiveTab] = useState<TabId>('workload');
    const queryClient = useQueryClient();

    const { data: employee, isLoading } = useQuery<any>({
        queryKey: ['employee', id],
        queryFn: async () => (await fetch(`/api/employees/${id}`)).json(),
    });

    const { data: workloads = [] } = useQuery<any[]>({
        queryKey: ['employee_workloads', id],
        queryFn: async () => (await fetch(`/api/employees/${id}/workloads`)).json(),
    });

    const { data: employmentHistory = [] } = useQuery<any[]>({
        queryKey: ['employee_employment_history', id],
        queryFn: async () => (await fetch(`/api/employees/${id}/employment-history`)).json(),
    });

    const statusMutation = useMutation({
        mutationFn: async (status: AccountStatus) => {
            await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountStatus: status }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee', id] }),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
    if (!employee) return <div className="p-8 text-center text-muted-foreground">社員が見つかりません。</div>;

    const acct = accountStatusConfig[employee.accountStatus as AccountStatus];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/employees" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 社員一覧へ戻る
            </Link>

            {/* Profile header */}
            <Card>
                <CardContent className="pt-6 flex flex-col sm:flex-row items-start gap-6 relative">
                    <button className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-brand-500 hover:bg-muted rounded-xl transition-colors hidden sm:block">
                        <Edit3 className="w-4 h-4" />
                    </button>

                    <div className="w-16 h-16 rounded-full bg-muted border-4 border-background shadow-md flex items-center justify-center shrink-0">
                        <User className="w-8 h-8 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold">{employee.name}</h1>
                            {employee.currentEmploymentCategory && (
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', categoryColors[employee.currentEmploymentCategory])}>
                                    {EmploymentCategoryLabel[employee.currentEmploymentCategory as keyof typeof EmploymentCategoryLabel]}
                                </span>
                            )}
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', acct.className)}>
                                {acct.label}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">{employee.email}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">支社</p>
                                <p className="font-medium">{employee.branch?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">入社日</p>
                                <p className="font-medium">{new Date(employee.hireDate).toLocaleDateString('ja-JP')}</p>
                            </div>
                            {employee.leaveDate && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">退職日</p>
                                    <p className="font-medium">{new Date(employee.leaveDate).toLocaleDateString('ja-JP')}</p>
                                </div>
                            )}
                        </div>

                        {/* Account action buttons */}
                        {!employee.leaveDate && (
                            <div className="flex gap-2 mt-4">
                                {employee.accountStatus !== 'active' ? (
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-green-500 hover:bg-green-600 text-white"
                                        onClick={() => statusMutation.mutate('active')}
                                        disabled={statusMutation.isPending}
                                    >
                                        <UserCheck className="w-4 h-4" /> Activate アカウント発行
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() => statusMutation.mutate('disabled')}
                                        disabled={statusMutation.isPending}
                                    >
                                        <UserX className="w-4 h-4" /> Disable アカウント停止
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
                <div className="flex overflow-x-auto border-b border-border">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap outline-none',
                                activeTab === tab.id
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                            )}
                        >
                            <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-brand-500' : 'text-muted-foreground')} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                <CardContent className="pt-6">
                    {/* Workload Tab */}
                    {activeTab === 'workload' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">稼働履歴（人月）</h3>
                                <Button size="sm" variant="outline">＋ 追加</Button>
                            </div>
                            {workloads.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">稼働履歴がありません</p>
                            ) : (
                                workloads.map((wl: any) => (
                                    <div key={wl.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">稼働率 {wl.workload * 100}%</span>
                                                {!wl.endDate && <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">現在</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(wl.startDate).toLocaleDateString('ja-JP')} 〜 {wl.endDate ? new Date(wl.endDate).toLocaleDateString('ja-JP') : '現在'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Employment History Tab */}
                    {activeTab === 'employment' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">雇用区分の変遷</h3>
                                <Button size="sm" variant="outline">＋ 追加</Button>
                            </div>
                            {employmentHistory.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">履歴がありません</p>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-4 top-3 bottom-3 w-px bg-border"></div>
                                    <div className="space-y-4 pl-10">
                                        {employmentHistory.map((h: any, i: number) => (
                                            <div key={h.id} className="relative">
                                                <div className={cn(
                                                    'absolute -left-6 w-3 h-3 rounded-full border-2 border-background',
                                                    i === 0 ? 'bg-brand-500' : 'bg-muted-foreground',
                                                )}></div>
                                                <div className="p-4 rounded-xl border border-border">
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn('text-sm font-medium px-2 py-0.5 rounded-full', categoryColors[h.category])}>
                                                            {EmploymentCategoryLabel[h.category as keyof typeof EmploymentCategoryLabel]}
                                                        </span>
                                                        {i === 0 && <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">現在</span>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {new Date(h.startDate).toLocaleDateString('ja-JP')} 〜 {h.endDate ? new Date(h.endDate).toLocaleDateString('ja-JP') : '現在'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'shifts' && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <CalendarDays className="w-12 h-12 mb-4 opacity-30" />
                            <p>シフト機能は開発中です</p>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <History className="w-12 h-12 mb-4 opacity-30" />
                            <p>履歴データは開発中です</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
