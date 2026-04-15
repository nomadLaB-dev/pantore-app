'use client';
import { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
    EmploymentCategoryLabel, SalaryTypeLabel,
    FIXED_TERM_CATEGORIES, EmploymentCategory, SalaryType,
} from '@/types';

const BRANCHES = [
    { id: 'b1', name: '本社' },
    { id: 'b2', name: '大阪支社' },
    { id: 'b3', name: '横浜倉庫・拠点' },
];

interface Props {
    employeeId: string;
    record?: any;
    open: boolean;
    onClose: () => void;
}

const empty = {
    category: 'full_time' as EmploymentCategory,
    startDate: '',
    endDate: '',
    salary: '',
    salaryType: 'monthly' as SalaryType,
    contractStartDate: '',
    contractEndDate: '',
    renewalPlanned: false,
    primaryBranchId: '',
    assignmentNote: '',
};

export function EmploymentHistoryModal({ employeeId, record, open, onClose }: Props) {
    const qc = useQueryClient();
    const isEdit = !!record;
    const [form, setForm] = useState(empty);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (record) {
            setForm({
                category: record.category ?? 'full_time',
                startDate: record.startDate ? new Date(record.startDate).toISOString().slice(0, 10) : '',
                endDate: record.endDate ? new Date(record.endDate).toISOString().slice(0, 10) : '',
                salary: record.salary ? String(record.salary) : '',
                salaryType: record.salaryType ?? 'monthly',
                contractStartDate: record.contractStartDate ? new Date(record.contractStartDate).toISOString().slice(0, 10) : '',
                contractEndDate: record.contractEndDate ? new Date(record.contractEndDate).toISOString().slice(0, 10) : '',
                renewalPlanned: record.renewalPlanned ?? false,
                primaryBranchId: record.primaryBranchId ?? '',
                assignmentNote: record.assignmentNote ?? '',
            });
        } else {
            setForm(empty);
        }
        setConfirmDelete(false);
    }, [record, open]);

    const set = (key: string) => (v: string | null) => v !== null && setForm((f) => ({ ...f, [key]: v }));
    const isFixed = FIXED_TERM_CATEGORIES.includes(form.category);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const body = {
                ...form,
                salary: form.salary ? Number(form.salary) : null,
                endDate: form.endDate || null,
                contractStartDate: form.contractStartDate || null,
                contractEndDate: form.contractEndDate || null,
                primaryBranchId: form.primaryBranchId || null,
                assignmentNote: form.assignmentNote || null,
            };
            const url = `/api/employees/${employeeId}/employment-history` + (isEdit ? `/${record.id}` : '');
            const method = isEdit ? 'PUT' : 'POST';
            await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employee_employment_history', employeeId] });
            qc.invalidateQueries({ queryKey: ['employee', employeeId] });
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await fetch(`/api/employees/${employeeId}/employment-history/${record.id}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employee_employment_history', employeeId] });
            qc.invalidateQueries({ queryKey: ['employee', employeeId] });
            onClose();
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '雇用・配置情報を編集' : '雇用・配置情報を追加'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">

                    {/* ── 雇用区分 ───────────────────────────── */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">雇用区分</p>
                        <Select value={form.category} onValueChange={set('category')}>
                            <SelectTrigger><SelectValue placeholder="選択">{form.category ? EmploymentCategoryLabel[form.category as keyof typeof EmploymentCategoryLabel] : ''}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(EmploymentCategoryLabel).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ── 区分期間 ───────────────────────────── */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">区分の開始・終了</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">開始日 <span className="text-red-500">*</span></label>
                                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">終了日</label>
                                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* ── 主な配置 ───────────────────────────── */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">主な配置（異動先）</p>
                        <div className="space-y-2.5">
                            <Select value={form.primaryBranchId} onValueChange={set('primaryBranchId')}>
                                <SelectTrigger><SelectValue placeholder="支社・拠点を選択">{form.primaryBranchId === '_none' ? '未設定' : BRANCHES.find((b) => b.id === form.primaryBranchId)?.name}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">未設定</SelectItem>
                                    {BRANCHES.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="部署名・役職など（例: 営業部 第1グループ）"
                                value={form.assignmentNote}
                                onChange={(e) => setForm({ ...form, assignmentNote: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* ── 給与 ───────────────────────────────── */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">給与</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Input type="number" placeholder="280000" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                            </div>
                            <div>
                                <Select value={form.salaryType} onValueChange={set('salaryType')}>
                                    <SelectTrigger><SelectValue placeholder="選択">{form.salaryType ? SalaryTypeLabel[form.salaryType as keyof typeof SalaryTypeLabel] : ''}</SelectValue></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SalaryTypeLabel).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* ── 有期契約期間（有期区分のみ） ────────── */}
                    {isFixed && (
                        <div className="pt-1 border-t border-border space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">有期契約期間</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">契約開始日</label>
                                    <Input type="date" value={form.contractStartDate} onChange={(e) => setForm({ ...form, contractStartDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">契約終了日</label>
                                    <Input type="date" value={form.contractEndDate} onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <div
                                    onClick={() => setForm((f) => ({ ...f, renewalPlanned: !f.renewalPlanned }))}
                                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.renewalPlanned ? 'bg-brand-500' : 'bg-muted-foreground/30'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.renewalPlanned ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm">更新予定（アラート非表示）</span>
                            </label>
                        </div>
                    )}

                    {/* Delete confirm */}
                    {isEdit && confirmDelete && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                            <p className="font-semibold mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> 本当に削除しますか？</p>
                            <p className="text-xs opacity-80">この操作は取り消せません。</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center mt-2">
                    {isEdit && !confirmDelete && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 mr-auto" onClick={() => setConfirmDelete(true)}>
                            <Trash2 className="w-4 h-4" /> 削除
                        </Button>
                    )}
                    {isEdit && confirmDelete && (
                        <div className="flex gap-2 mr-auto">
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>キャンセル</Button>
                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-1.5" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                                <Trash2 className="w-3.5 h-3.5" /> {deleteMutation.isPending ? '削除中…' : '削除する'}
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.category || !form.startDate || saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                    >
                        {saveMutation.isPending ? '保存中…' : isEdit ? '変更を保存' : '追加する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
