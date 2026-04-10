'use client';
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
    active: { label: '有効', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    disabled: { label: '無効', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
    none: { label: '未発行', className: 'bg-transparent border border-border text-muted-foreground' },
};

export default function EmployeesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const queryClient = useQueryClient();

    const { data: employees = [], isLoading } = useQuery<any[]>({
        queryKey: ['employees', showArchived],
        queryFn: async () => {
            const url = `/api/employees${showArchived ? '?includeArchived=true' : ''}`;
            return (await fetch(url)).json();
        },
    });

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
            e.name.includes(searchTerm) ||
            e.email.includes(searchTerm) ||
            e.branch?.name?.includes(searchTerm),
    );

    const active = employees.filter((e) => !e.leaveDate && e.accountStatus === 'active').length;
    const disabled = employees.filter((e) => !e.leaveDate && e.accountStatus === 'disabled').length;
    const noAccount = employees.filter((e) => !e.leaveDate && e.accountStatus === 'none').length;

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
                    { label: '在籍中（有効）', value: active },
                    { label: 'アカウント無効', value: disabled },
                    { label: '未発行', value: noAccount },
                    { label: '退職済（アーカイブ）', value: employees.filter((e) => e.leaveDate).length },
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
                            <><ArchiveRestore className="w-4 h-4" />アーカイブを非表示</>
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
                                return (
                                    <TableRow key={emp.id} className={cn(emp.leaveDate && 'opacity-60')}>
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
                                            <Badge variant={emp.leaveDate ? 'secondary' : 'outline'} className={emp.leaveDate ? '' : 'border-brand-500 text-brand-600 dark:text-brand-400'}>
                                                {emp.leaveDate ? 'アーカイブ' : '在籍中'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Account action buttons */}
                                                {!emp.leaveDate && (
                                                    <>
                                                        {emp.accountStatus !== 'active' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20 text-xs h-8"
                                                                onClick={() => statusMutation.mutate({ id: emp.id, status: 'active' })}
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" /> Activate
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5 text-slate-500 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-xs h-8"
                                                                onClick={() => statusMutation.mutate({ id: emp.id, status: 'disabled' })}
                                                            >
                                                                <UserX className="w-3.5 h-3.5" /> Disable
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
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
