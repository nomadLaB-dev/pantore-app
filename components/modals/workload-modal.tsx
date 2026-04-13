'use client';
import { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
    employeeId: string;
    record?: any;   // null = adding new
    open: boolean;
    onClose: () => void;
}

const empty = { workload: '', startDate: '', endDate: '' };

export function WorkloadModal({ employeeId, record, open, onClose }: Props) {
    const qc = useQueryClient();
    const isEdit = !!record;
    const [form, setForm] = useState(empty);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (record) {
            setForm({
                workload: record.workload ? String(Math.round(record.workload * 100)) : '',
                startDate: record.startDate ? new Date(record.startDate).toISOString().slice(0, 10) : '',
                endDate: record.endDate ? new Date(record.endDate).toISOString().slice(0, 10) : '',
            });
        } else {
            setForm(empty);
        }
        setConfirmDelete(false);
    }, [record, open]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const body = {
                workload: Number(form.workload) / 100,
                startDate: form.startDate,
                endDate: form.endDate || null,
            };
            const url = `/api/employees/${employeeId}/workloads` + (isEdit ? `/${record.id}` : '');
            const method = isEdit ? 'PUT' : 'POST';
            await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employee_workloads', employeeId] });
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await fetch(`/api/employees/${employeeId}/workloads/${record.id}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employee_workloads', employeeId] });
            onClose();
        },
    });

    const workloadNum = Number(form.workload);
    const validWorkload = workloadNum >= 1 && workloadNum <= 100;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '稼働履歴を編集' : '稼働履歴を追加'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">稼働率（%） <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                placeholder="100"
                                value={form.workload}
                                onChange={(e) => setForm({ ...form, workload: e.target.value })}
                                className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                        </div>
                        {form.workload && !validWorkload && (
                            <p className="text-xs text-red-500 mt-1">1〜100の値を入力してください</p>
                        )}
                    </div>

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
                        disabled={!form.workload || !form.startDate || !validWorkload || saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                    >
                        {saveMutation.isPending ? '保存中…' : isEdit ? '変更を保存' : '追加する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
