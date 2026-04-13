'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, User, Activity, CalendarDays, Edit3,
    UserCheck, UserX, Briefcase, BadgeJapaneseYen, AlertTriangle,
    CheckCircle2, Clock, Pencil, MapPin, History
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmploymentCategoryLabel, SalaryTypeLabel, AccountStatus, FIXED_TERM_CATEGORIES } from '@/types';
import { Badge } from '@/components/ui/badge';
import { EmploymentHistoryModal } from '@/components/modals/employment-history-modal';
import { WorkloadModal } from '@/components/modals/workload-modal';
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
    { id: 'employment', name: '雇用・配置履歴', icon: Briefcase },
    { id: 'shifts', name: 'シフト', icon: CalendarDays },
] as const;
type TabId = typeof TABS[number]['id'];

function daysUntil(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function formatSalary(amount: number | null, type: string | null) {
    if (!amount || !type) return '—';
    const fmt = `¥${amount.toLocaleString()}`;
    switch (type) {
        case 'monthly': return `${fmt} / 月`;
        case 'hourly': return `${fmt} / 時`;
        case 'annual': return `${fmt} / 年`;
        default: return fmt;
    }
}

export default function EmployeeDetailPage() {
    const { id } = useParams() as { id: string };
    const [activeTab, setActiveTab] = useState<TabId>('workload');
    const queryClient = useQueryClient();

    // Modal state
    const [empHistModal, setEmpHistModal] = useState<{ open: boolean; record?: any }>({ open: false });
    const [workloadModal, setWorkloadModal] = useState<{ open: boolean; record?: any }>({ open: false });

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

    // Contract expiry alert for the current history record
    const currentHistory = employmentHistory[0] as any;
    const isFixedTerm = currentHistory && FIXED_TERM_CATEGORIES.includes(currentHistory.category);
    const contractEnd = currentHistory?.contractEndDate;
    const renewalPlanned = currentHistory?.renewalPlanned;
    const daysLeft = contractEnd ? daysUntil(contractEnd) : null;
    const showAlert = isFixedTerm && contractEnd && !renewalPlanned && daysLeft !== null && daysLeft <= 60;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/employees" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 社員一覧へ戻る
            </Link>

            {/* Contract expiry alert banner */}
            {showAlert && (
                <div className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border',
                    daysLeft! <= 30
                        ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'
                        : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400',
                )}>
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm">
                            契約期限が{daysLeft! <= 30 ? '1ヶ月以内' : '2ヶ月以内'}に迫っています
                        </p>
                        <p className="text-sm opacity-80">
                            契約終了日: {new Date(contractEnd).toLocaleDateString('ja-JP')}（残り {daysLeft} 日）
                            — 更新予定に設定するとこのアラートは非表示になります。
                        </p>
                    </div>
                </div>
            )}

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

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">支社</p>
                                <p className="font-medium">{employee.branch?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">入社日</p>
                                <p className="font-medium">{new Date(employee.hireDate).toLocaleDateString('ja-JP')}</p>
                            </div>
                            {employee.currentSalary && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">現在の給与</p>
                                    <p className="font-medium">{formatSalary(employee.currentSalary, employee.currentSalaryType)}</p>
                                </div>
                            )}
                            {employee.currentContractEnd && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">契約期限</p>
                                    <div className="flex items-center gap-1.5">
                                        <p className={cn('font-medium', showAlert ? (daysLeft! <= 30 ? 'text-red-600' : 'text-amber-600') : '')}>
                                            {new Date(employee.currentContractEnd).toLocaleDateString('ja-JP')}
                                        </p>
                                        {renewalPlanned && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                    </div>
                                </div>
                            )}
                            {employee.leaveDate && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">退職日</p>
                                    <p className="font-medium">{new Date(employee.leaveDate).toLocaleDateString('ja-JP')}</p>
                                </div>
                            )}
                        </div>

                        {!employee.leaveDate && (
                            <div className="flex gap-2 mt-4">
                                {employee.accountStatus !== 'active' ? (
                                    <Button size="sm" className="gap-2 bg-green-500 hover:bg-green-600 text-white" onClick={() => statusMutation.mutate('active')} disabled={statusMutation.isPending}>
                                        <UserCheck className="w-4 h-4" /> Activate アカウント発行
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="outline" className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => statusMutation.mutate('disabled')} disabled={statusMutation.isPending}>
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
                                <Button size="sm" variant="outline" onClick={() => setWorkloadModal({ open: true })}>＋ 追加</Button>
                            </div>
                            {workloads.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">稼働履歴がありません</p>
                            ) : (
                                workloads.map((wl: any) => (
                                    <button
                                        key={wl.id}
                                        onClick={() => setWorkloadModal({ open: true, record: wl })}
                                        className="w-full flex items-center justify-between p-4 border border-border rounded-xl hover:border-brand-400 hover:bg-muted/40 transition-colors text-left group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">稼働率 {Math.round(wl.workload * 100)}%</span>
                                                {!wl.endDate && <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">現在</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(wl.startDate).toLocaleDateString('ja-JP')} 〜 {wl.endDate ? new Date(wl.endDate).toLocaleDateString('ja-JP') : '現在'}
                                            </p>
                                        </div>
                                        <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Employment & Salary History Tab */}
                    {activeTab === 'employment' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">雇用・配置の変遷</h3>
                                <Button size="sm" variant="outline" onClick={() => setEmpHistModal({ open: true })}>＋ 追加</Button>
                            </div>
                            {employmentHistory.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">履歴がありません</p>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />
                                    <div className="space-y-4 pl-10">
                                        {employmentHistory.map((h: any, i: number) => {
                                            const isFixed = FIXED_TERM_CATEGORIES.includes(h.category);
                                            const endDays = h.contractEndDate ? daysUntil(h.contractEndDate) : null;
                                            const expiring = isFixed && !h.renewalPlanned && endDays !== null && endDays <= 60 && endDays > 0;

                                            return (
                                                <div key={h.id} className="relative">
                                                    <div className={cn(
                                                        'absolute -left-6 w-3 h-3 rounded-full border-2 border-background',
                                                        i === 0 ? 'bg-brand-500' : 'bg-muted-foreground',
                                                    )} />
                                                    <button
                                                        onClick={() => setEmpHistModal({ open: true, record: h })}
                                                        className={cn(
                                                            'w-full text-left p-4 rounded-xl border group hover:border-brand-400 hover:bg-muted/30 transition-colors',
                                                            expiring
                                                                ? (endDays! <= 30 ? 'border-red-300 dark:border-red-700' : 'border-amber-300 dark:border-amber-700')
                                                                : 'border-border',
                                                        )}
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className={cn('text-sm font-medium px-2.5 py-0.5 rounded-full', categoryColors[h.category])}>
                                                                {EmploymentCategoryLabel[h.category as keyof typeof EmploymentCategoryLabel]}
                                                            </span>
                                                            {i === 0 && <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">現在</span>}
                                                            {h.renewalPlanned && (
                                                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> 更新予定
                                                                </span>
                                                            )}
                                                            {expiring && (
                                                                <span className={cn(
                                                                    'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                                                                    endDays! <= 30
                                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                )}>
                                                                    <AlertTriangle className="w-3 h-3" /> 残り {endDays} 日
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Assignment / placement */}
                                                        {(h.assignmentNote || h.primaryBranchId) && (
                                                            <div className="flex items-start gap-1.5 mb-2">
                                                                <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                                                                <span className="text-sm text-foreground">
                                                                    {[h.primaryBranch?.name, h.assignmentNote].filter(Boolean).join(' · ')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Salary */}
                                                        {h.salary && (
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <BadgeJapaneseYen className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span className="text-sm font-semibold tabular-nums">{formatSalary(h.salary, h.salaryType)}</span>
                                                                {h.salaryType && <span className="text-xs text-muted-foreground">({SalaryTypeLabel[h.salaryType as keyof typeof SalaryTypeLabel]})</span>}
                                                            </div>
                                                        )}

                                                        {/* Period */}
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <p className="text-xs text-muted-foreground">
                                                                区分期間: {new Date(h.startDate).toLocaleDateString('ja-JP')} 〜 {h.endDate ? new Date(h.endDate).toLocaleDateString('ja-JP') : '現在'}
                                                            </p>
                                                        </div>

                                                        {/* Fixed-term contract dates */}
                                                        {isFixed && h.contractEndDate && (
                                                            <div className="mt-2 pt-2 border-t border-border">
                                                                <p className="text-xs text-muted-foreground">
                                                                    契約期間: {h.contractStartDate ? new Date(h.contractStartDate).toLocaleDateString('ja-JP') : '—'}
                                                                    {' 〜 '}
                                                                    <span className={cn('font-medium', expiring ? (endDays! <= 30 ? 'text-red-600' : 'text-amber-600') : '')}>
                                                                        {new Date(h.contractEndDate).toLocaleDateString('ja-JP')}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        )}
                                                        <Pencil className="absolute top-3 right-3 w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>
                                            );
                                        })}
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
                </CardContent>
            </Card>

            {/* Modals */}
            <EmploymentHistoryModal
                employeeId={id}
                record={empHistModal.record}
                open={empHistModal.open}
                onClose={() => setEmpHistModal({ open: false })}
            />
            <WorkloadModal
                employeeId={id}
                record={workloadModal.record}
                open={workloadModal.open}
                onClose={() => setWorkloadModal({ open: false })}
            />
        </div>
    );
}
