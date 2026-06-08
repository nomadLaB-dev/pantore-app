'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, User, ChevronRight, UserCheck, UserX, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmploymentCategoryLabel, AccountStatus } from '@/types';
import { cn } from '@/lib/utils';
import { NewEmployeeModal } from '@/components/modals/new-employee-modal';

const categoryColors: Record<string, string> = {
    full_time: 'border-blue-500 text-blue-600 dark:text-blue-400',
    part_time: 'border-amber-500 text-amber-600 dark:text-amber-400',
    contract: 'border-violet-500 text-violet-600 dark:text-violet-400',
    dispatch: 'border-teal-500 text-teal-600 dark:text-teal-400',
};

const accountStatusConfig: Record<AccountStatus, { label: string; className: string }> = {
    active: { label: '有', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    disabled: { label: '無', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
    none: { label: '無', className: 'bg-transparent border border-border text-muted-foreground' },
};

const employeeStatusConfig: Record<'active' | 'scheduled' | 'retired', { label: string; className: string }> = {
    active: {
        label: '在籍',
        className: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10',
    },
    scheduled: {
        label: '退職予定',
        className: 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10',
    },
    retired: {
        label: '退職済',
        className: 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400 bg-slate-500/5 hover:bg-slate-500/10',
    },
};

export default function EmployeesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const queryClient = useQueryClient();

    const { data: employees = [], isLoading } = useQuery<any[]>({
        queryKey: ['employees', { includeArchived: true }],
        queryFn: async () => {
            return (await fetch('/api/employees?includeArchived=true')).json();
        },
    });

    const getEmployeeStatus = (employee: any): 'active' | 'scheduled' | 'retired' => {
        if (!employee.leaveDate) return 'active';

        // 日本時間(JST)の今日の日付（YYYY-MM-DD）を取得
        const jstOffset = 9 * 60 * 60 * 1000;
        const todayJST = new Date(Date.now() + jstOffset);
        const todayStr = todayJST.toISOString().split('T')[0];

        // 退職日の日付部分（YYYY-MM-DD）を取得
        const leaveDateStr = employee.leaveDate.split('T')[0];

        // 文字列の比較により、タイムゾーンや時間の丸め処理による境界ズレを防ぎます
        return leaveDateStr >= todayStr ? 'scheduled' : 'retired';
    };

    const isCurrentEmployee = (employee: any) => {
        const status = getEmployeeStatus(employee);
        return status === 'active' || status === 'scheduled';
    };

    // Mock account status mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: AccountStatus }) => {
            await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountStatus: status }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });

    const filtered = employees.filter(
        (e) =>
            (showArchived ? !isCurrentEmployee(e) : isCurrentEmployee(e)) &&
            (e.name.includes(searchTerm) ||
                e.email.includes(searchTerm) ||
                e.branch?.name?.includes(searchTerm)),
    );

    const active = employees.filter((e) => isCurrentEmployee(e) && e.accountStatus === 'active').length;
    const noAccount = employees.filter((e) => isCurrentEmployee(e) && e.accountStatus === 'none').length;
    const total = active + noAccount;
    const archived = employees.filter((e) => !isCurrentEmployee(e)).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">社員管理</h1>
                    <p className="text-muted-foreground text-sm">社員の情報・雇用区分・アカウント状態を管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => setShowNewModal(true)}>
                    <Plus className="w-4 h-4" /> 新規追加
                </Button>
                <NewEmployeeModal open={showNewModal} onClose={() => setShowNewModal(false)} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '在籍中', value: total },
                    { label: 'アカウント有', value: active },
                    { label: 'アカウント無', value: noAccount },
                    { label: '退職済', value: archived },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className="text-2xl font-bold">{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                {/* Toolbar */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="名前・メール・支社で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant={showArchived ? 'secondary' : 'outline'}
                        size="sm"
                        className="gap-2 shrink-0"
                        onClick={() => setShowArchived(!showArchived)}
                    >
                        {showArchived ? (
                            <><ArchiveRestore className="w-4 h-4" />在職者を表示</>
                        ) : (
                            <><Archive className="w-4 h-4" />退職者を表示</>
                        )}
                    </Button>
                </div>

                {/* Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>社員名</TableHead>
                            <TableHead className="hidden lg:table-cell">支社</TableHead>
                            <TableHead className="hidden md:table-cell">雇用区分</TableHead>
                            <TableHead className="hidden sm:table-cell">入社日</TableHead>
                            <TableHead className="text-center">アカウント</TableHead>
                            <TableHead className="text-center hidden sm:table-cell">在籍</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">読み込み中...</TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">社員が見つかりません</TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((emp) => {
                                const acct = accountStatusConfig[emp.accountStatus as AccountStatus];
                                const status = getEmployeeStatus(emp);
                                const statusCfg = employeeStatusConfig[status];
                                return (
                                    <TableRow
                                        key={emp.id}
                                        className={cn(
                                            status === 'scheduled' && 'bg-[#F0F0F0] dark:bg-[#2C2C2C] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] transition-colors',
                                            status === 'retired' && 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
                                        )}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium leading-tight">{emp.name}</p>
                                                    <p className="text-xs text-muted-foreground hidden sm:block">{emp.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                            {emp.branch?.name ?? '—'}
                                        </TableCell>

                                        <TableCell className="hidden md:table-cell">
                                            {emp.currentEmploymentCategory ? (
                                                <Badge variant="outline" className={cn('text-xs', categoryColors[emp.currentEmploymentCategory])}>
                                                    {EmploymentCategoryLabel[emp.currentEmploymentCategory as keyof typeof EmploymentCategoryLabel]}
                                                </Badge>
                                            ) : '—'}
                                        </TableCell>

                                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                            {new Date(emp.hireDate).toLocaleDateString('ja-JP')}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', acct.className)}>
                                                {acct.label}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-center hidden sm:table-cell">
                                            <Badge variant="outline" className={cn('text-xs font-medium border', statusCfg.className)}>
                                                {statusCfg.label}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={`/employees/${emp.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1 text-brand-500 h-8">
                                                        詳細 <ChevronRight className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

EmployeesPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
