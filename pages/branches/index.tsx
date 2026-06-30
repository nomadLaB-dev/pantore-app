'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, User, ChevronRight, Archive, ArchiveRestore, QrCode, Building2, Edit2, Trash2, Check, X as XIcon, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { EmploymentCategoryLabel, type SpecimenRole } from '@/types';
import { cn } from '@/lib/utils';
import { NewEmployeeModal } from '@/components/modals/new-employee-modal';
import { QRModal } from '@/components/modals/qr-modal';
import { useAppStore } from '@/store';
import { createClient } from '@/lib/supabase/client';

const MAX_DELIVERY_AREAS = 5;

const categoryColors: Record<string, string> = {
    full_time: 'border-blue-500 text-blue-600 dark:text-blue-400',
    part_time: 'border-amber-500 text-amber-600 dark:text-amber-400',
    contract: 'border-violet-500 text-violet-600 dark:text-violet-400',
    dispatch: 'border-teal-500 text-teal-600 dark:text-teal-400',
};

const ROLE_LABEL: Record<SpecimenRole, string> = {
    admin: '管理者',
    staff: 'スタッフ',
    base: '拠点長',
    driver: 'ドライバー',
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

export default function BranchesPage() {
    const specimenRole = useAppStore((s) => s.specimenRole);
    const myBranchId = useAppStore((s) => s.branchId);
    const isBaseRestricted = specimenRole === 'base';
    const canView = specimenRole === 'admin' || specimenRole === 'staff' || isBaseRestricted;
    const canEdit = specimenRole === 'admin';
    const queryClient = useQueryClient();

    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchAddress, setNewBranchAddress] = useState('');
    const [editingBranch, setEditingBranch] = useState(false);
    const [editBranchName, setEditBranchName] = useState('');
    const [editBranchAddress, setEditBranchAddress] = useState('');
    const [editBranchAreas, setEditBranchAreas] = useState<string[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [qrUser, setQrUser] = useState<any | null>(null);

    const { data: allBranches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => fetch('/api/branches').then((res) => res.json()).then((data) => Array.isArray(data) ? data : []),
    });

    // 拠点長は自身が所属する拠点・支社のみ閲覧可能
    const branches = isBaseRestricted ? allBranches.filter((b: any) => b.id === myBranchId) : allBranches;

    const { data: allEmployees = [], isLoading } = useQuery<any[]>({
        queryKey: ['users', { includeArchived: true }],
        queryFn: async () => (await fetch('/api/users?includeArchived=true')).json(),
    });

    // 検体管理設定の「配送エリア」マスタ（対応エリアのドロップダウン候補）
    const { data: deliveryAreaOptions = [] } = useQuery<any[]>({
        queryKey: ['settings_delivery_areas'],
        queryFn: async () => {
            const supabase = createClient();
            const { data } = await supabase.from('settings_delivery_areas').select('*').order('name');
            return data || [];
        },
    });

    useEffect(() => {
        if (!selectedBranchId && branches.length > 0) setSelectedBranchId(branches[0].id);
    }, [branches, selectedBranchId]);

    const checkOk = async (res: Response, fallback: string) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || fallback);
        return res.json();
    };

    const branchCreate = useMutation({
        mutationFn: async (data: { name: string; address: string }) =>
            checkOk(await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), '拠点の追加に失敗しました'),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            setShowAddBranch(false);
            setNewBranchName('');
            setNewBranchAddress('');
            if (created?.id) setSelectedBranchId(created.id);
        },
        onError: (e: Error) => alert(e.message),
    });

    const branchUpdate = useMutation({
        mutationFn: async (data: { id: string; name: string; address: string; deliveryAreas: string[] }) =>
            checkOk(await fetch(`/api/branches/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.name, address: data.address, deliveryAreas: data.deliveryAreas }) }), '拠点の更新に失敗しました'),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); setEditingBranch(false); },
        onError: (e: Error) => alert(e.message),
    });

    const branchDelete = useMutation({
        mutationFn: async (id: string) =>
            checkOk(await fetch(`/api/branches/${id}`, { method: 'DELETE' }), '拠点の削除に失敗しました'),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); setSelectedBranchId(''); },
        onError: (e: Error) => alert(e.message),
    });

    const getEmployeeStatus = (employee: any): 'active' | 'scheduled' | 'retired' => {
        if (!employee.leaveDate) return 'active';
        const jstOffset = 9 * 60 * 60 * 1000;
        const todayJST = new Date(Date.now() + jstOffset);
        const todayStr = todayJST.toISOString().split('T')[0];
        const leaveDateStr = employee.leaveDate.split('T')[0];
        return leaveDateStr >= todayStr ? 'scheduled' : 'retired';
    };

    const isCurrentEmployee = (employee: any) => {
        const status = getEmployeeStatus(employee);
        return status === 'active' || status === 'scheduled';
    };

    // 配送員（拠点長 / ドライバー）のみがこのページの対象
    const drivers = allEmployees.filter((e) => e.specimenRole === 'base' || e.specimenRole === 'driver');

    const branchDriverCount = (branchId: string) => drivers.filter((e) => e.branchId === branchId && isCurrentEmployee(e)).length;

    const selectedBranch = branches.find((b: any) => b.id === selectedBranchId);

    const filtered = drivers.filter(
        (e) =>
            e.branchId === selectedBranchId &&
            (showArchived ? !isCurrentEmployee(e) : isCurrentEmployee(e)) &&
            (roleFilter === 'all' || e.specimenRole === roleFilter) &&
            (e.name.includes(searchTerm) ||
                e.email.includes(searchTerm) ||
                (e.userCode || '').toLowerCase().includes(searchTerm.toLowerCase())),
    );

    if (!canView) {
        return <div className="p-8 text-center text-muted-foreground">このページを表示する権限がありません。</div>;
    }

    return (
        <div className="space-y-6">
            {qrUser && (
                <QRModal
                    user={qrUser}
                    onClose={() => setQrUser(null)}
                    onRegenerate={() => { queryClient.invalidateQueries({ queryKey: ['users'] }); setQrUser(null); }}
                />
            )}

            {showNewModal && selectedBranchId && (
                <NewEmployeeModal
                    open={showNewModal}
                    onClose={() => setShowNewModal(false)}
                    initialBranchId={selectedBranchId}
                    initialSpecimenRole="driver"
                    roleOptions={['base', 'driver']}
                />
            )}

            <div>
                <h1 className="text-2xl font-bold tracking-tight">拠点・支社管理</h1>
                <p className="text-muted-foreground text-sm">拠点・支社の情報と、拠点ごとに配置する配送員を管理します。</p>
            </div>

            {/* 拠点タブ */}
            <Card>
                <div className="flex items-center gap-0.5 px-2 overflow-x-auto border-b border-border">
                    {branches.map((b: any) => (
                        <button
                            key={b.id}
                            onClick={() => { setSelectedBranchId(b.id); setEditingBranch(false); }}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
                                selectedBranchId === b.id
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                            )}
                        >
                            <Building2 size={14} />
                            {b.name}
                            <span className={cn('text-xs font-normal', selectedBranchId === b.id ? 'text-brand-400' : 'text-muted-foreground/60')}>
                                {branchDriverCount(b.id)}
                            </span>
                        </button>
                    ))}
                    {canEdit && (
                        <button
                            onClick={() => setShowAddBranch(!showAddBranch)}
                            className="flex items-center gap-1 px-3 py-3 text-sm font-medium text-brand-500 hover:text-brand-600 whitespace-nowrap"
                        >
                            <Plus size={14} /> 拠点を追加
                        </button>
                    )}
                </div>

                {showAddBranch && (
                    <div className="p-4 border-b border-border flex gap-2 items-center bg-muted/30">
                        <Input placeholder="拠点・支社名" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} className="w-1/3" />
                        <Input placeholder="住所" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} className="flex-1" />
                        <Button size="sm" variant="outline" onClick={() => setShowAddBranch(false)}>キャンセル</Button>
                        <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white shrink-0" disabled={!newBranchName || branchCreate.isPending} onClick={() => branchCreate.mutate({ name: newBranchName, address: newBranchAddress })}>
                            追加
                        </Button>
                    </div>
                )}

                {selectedBranch && (
                    <div className="p-4">
                        {editingBranch ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Input autoFocus value={editBranchName} onChange={(e) => setEditBranchName(e.target.value)} className="w-1/3" />
                                    <Input value={editBranchAddress} onChange={(e) => setEditBranchAddress(e.target.value)} className="flex-1" />
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingBranch(false)}><XIcon className="w-4 h-4" /></Button>
                                    <Button size="sm" className="h-8 w-8 p-0 bg-brand-500 text-white" disabled={!editBranchName} onClick={() => branchUpdate.mutate({ id: selectedBranch.id, name: editBranchName, address: editBranchAddress, deliveryAreas: editBranchAreas })}><Check className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />対応エリア（最大{MAX_DELIVERY_AREAS}）</span>
                                    {editBranchAreas.map((area) => (
                                        <Badge key={area} variant="outline" className="gap-1 text-xs">
                                            {area}
                                            <button onClick={() => setEditBranchAreas((prev) => prev.filter((a) => a !== area))} className="text-muted-foreground hover:text-red-600">
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {editBranchAreas.length < MAX_DELIVERY_AREAS && (
                                        <select
                                            value=""
                                            onChange={(e) => { if (e.target.value) setEditBranchAreas((prev) => [...prev, e.target.value]); }}
                                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-muted-foreground"
                                        >
                                            <option value="">+ エリアを追加</option>
                                            {Array.from(new Set(deliveryAreaOptions.map((a: any) => (a.description || a.name) as string)))
                                                .filter((label) => label && !editBranchAreas.includes(label))
                                                .sort((a, b) => a.localeCompare(b, 'ja'))
                                                .map((label) => (
                                                    <option key={label} value={label}>{label}</option>
                                                ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-semibold">{selectedBranch.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedBranch.address || '住所未登録'}</p>
                                    {(selectedBranch.delivery_areas?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                                            {selectedBranch.delivery_areas.map((area: string) => (
                                                <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {canEdit && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingBranch(true); setEditBranchName(selectedBranch.name); setEditBranchAddress(selectedBranch.address || ''); setEditBranchAreas(selectedBranch.delivery_areas || []); }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600" onClick={() => { if (confirm(`${selectedBranch.name}を削除してよろしいですか？`)) branchDelete.mutate(selectedBranch.id); }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {selectedBranchId && (
                <Card>
                    {/* Toolbar */}
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="名前・メール・集材員コードで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {(['all', 'base', 'driver'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                                        roleFilter === role ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    )}
                                >
                                    {role === 'all' ? 'すべて' : ROLE_LABEL[role as SpecimenRole]}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant={showArchived ? 'secondary' : 'outline'}
                            size="sm"
                            className="gap-2 shrink-0"
                            onClick={() => setShowArchived(!showArchived)}
                        >
                            {showArchived ? (
                                <><ArchiveRestore className="w-4 h-4" />在籍者を表示</>
                            ) : (
                                <><Archive className="w-4 h-4" />退職者を表示</>
                            )}
                        </Button>
                        {canEdit && (
                            <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2 shrink-0" onClick={() => setShowNewModal(true)}>
                                <Plus className="w-4 h-4" /> 配送員を追加
                            </Button>
                        )}
                    </div>

                    {/* Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden lg:table-cell">集材員コード</TableHead>
                                <TableHead>氏名</TableHead>
                                <TableHead className="hidden lg:table-cell">権限ロール</TableHead>
                                <TableHead className="hidden md:table-cell">雇用形態</TableHead>
                                <TableHead className="hidden sm:table-cell">入社日</TableHead>
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
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">配送員が見つかりません</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((emp) => {
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
                                            <TableCell className="hidden lg:table-cell">
                                                {emp.userCode ? <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{emp.userCode}</span> : <span className="text-muted-foreground text-xs">未設定</span>}
                                            </TableCell>

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

                                            <TableCell className="hidden lg:table-cell">
                                                {emp.specimenRole ? (
                                                    <Badge variant={emp.specimenRole === 'base' ? 'outline' : 'destructive'}>{ROLE_LABEL[emp.specimenRole as SpecimenRole]}</Badge>
                                                ) : <span className="text-muted-foreground text-xs">—</span>}
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

                                            <TableCell className="text-center hidden sm:table-cell">
                                                <Badge variant="outline" className={cn('text-xs font-medium border', statusCfg.className)}>
                                                    {statusCfg.label}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {canEdit && emp.userCode && emp.qrToken && (
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600" title="QRコード表示" onClick={() => setQrUser({ id: emp.id, name: emp.name, user_code: emp.userCode, qr_token: emp.qrToken })}>
                                                            <QrCode className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Link href={`/users/${emp.id}`}>
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
            )}

            {branches.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {isBaseRestricted
                            ? '所属する拠点・支社が設定されていません。管理者にお問い合わせください。'
                            : '拠点・支社が登録されていません。「拠点を追加」から作成してください。'}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

BranchesPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
