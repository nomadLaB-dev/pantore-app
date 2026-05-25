'use client';
import { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    employeeId: string;
    record?: any;   // null = adding new
    open: boolean;
    onClose: () => void;
}

const QUALIFICATION_OPTIONS = [
    { value: 'ipd', label: 'IPD' },
    { value: 'inter', label: 'Inter' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'q_dome', label: 'Q-DOME' },
    { value: 'mediford', label: 'MEDIFORD' },
];

const STATUS_OPTIONS = [
    { value: 'none', label: '無資格' },
    { value: 'training', label: '研修中' },
    { value: 'qualified', label: '有資格' },
];

const empty = {
    qualification: '',
    qualificationStatus: 'none',
    acquiredDate: '',
    lastWorkDate: '',
    isActive: true,
    trainingDate: '',
    ojt1stDate: '',
    ojt2ndDate: '',
    ojt3rdDate: '',
    assessmentDate: '',
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toISOString().slice(0, 10);
    } catch {
        return '';
    }
}

export function QualificationModal({ employeeId, record, open, onClose }: Props) {
    const qc = useQueryClient();
    const isEdit = !!record;
    const [form, setForm] = useState(empty);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setErrorMsg(null);
            if (record) {
                setForm({
                    qualification: record.qualification || '',
                    qualificationStatus: record.qualificationStatus || 'none',
                    acquiredDate: record.acquiredDate ? formatDate(record.acquiredDate) : '',
                    lastWorkDate: record.lastWorkDate ? formatDate(record.lastWorkDate) : '',
                    isActive: record.isActive !== undefined ? record.isActive : true,
                    trainingDate: record.trainingDate ? formatDate(record.trainingDate) : '',
                    ojt1stDate: record.ojt1stDate ? formatDate(record.ojt1stDate) : '',
                    ojt2ndDate: record.ojt2ndDate ? formatDate(record.ojt2ndDate) : '',
                    ojt3rdDate: record.ojt3rdDate ? formatDate(record.ojt3rdDate) : '',
                    assessmentDate: record.assessmentDate ? formatDate(record.assessmentDate) : '',
                });
            } else {
                setForm(empty);
            }
        }
    }, [record, open]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            setErrorMsg(null);
            const url = `/api/employees/${employeeId}/qualifications`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '保存に失敗しました');
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employee_qualifications', employeeId] });
            onClose();
        },
        onError: (err: any) => {
            setErrorMsg(err.message || '保存に失敗しました');
        }
    });

    const isFormValid = !!form.qualification;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '資格を編集' : '資格を追加'}</DialogTitle>
                </DialogHeader>

                {errorMsg && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                        <div>
                            <p className="font-semibold">エラーが発生しました</p>
                            <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4 pt-2">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            資格区分 <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={form.qualification}
                            onValueChange={(val) => setForm({ ...form, qualification: val || '' })}
                            disabled={isEdit}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="資格区分を選択">
                                    {QUALIFICATION_OPTIONS.find((opt) => opt.value === form.qualification)?.label || ''}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {QUALIFICATION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            ステータス
                        </label>
                        <Select
                            value={form.qualificationStatus}
                            onValueChange={(val) => setForm({ ...form, qualificationStatus: val || '' })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="ステータスを選択">
                                    {STATUS_OPTIONS.find((opt) => opt.value === form.qualificationStatus)?.label || ''}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">
                                研修日
                            </label>
                            <Input
                                type="date"
                                value={form.trainingDate}
                                onChange={(e) => setForm({ ...form, trainingDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                OJT1回目
                            </label>
                            <Input
                                type="date"
                                value={form.ojt1stDate}
                                onChange={(e) => setForm({ ...form, ojt1stDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                OJT2回目
                            </label>
                            <Input
                                type="date"
                                value={form.ojt2ndDate}
                                onChange={(e) => setForm({ ...form, ojt2ndDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                OJT3回目
                            </label>
                            <Input
                                type="date"
                                value={form.ojt3rdDate}
                                onChange={(e) => setForm({ ...form, ojt3rdDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                見極め日
                            </label>
                            <Input
                                type="date"
                                value={form.assessmentDate}
                                onChange={(e) => setForm({ ...form, assessmentDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                資格取得日
                            </label>
                            <Input
                                type="date"
                                value={form.acquiredDate}
                                onChange={(e) => setForm({ ...form, acquiredDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                最終勤務日
                            </label>
                            <Input
                                type="date"
                                value={form.lastWorkDate}
                                onChange={(e) => setForm({ ...form, lastWorkDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border rounded-xl">
                        <div>
                            <label className="text-sm font-medium block">
                                アクティブ状態 <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                                ONで有効、OFFで無効
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, isActive: !form.isActive })}
                            className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                form.isActive ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                    form.isActive ? "translate-x-5" : "translate-x-0"
                                )}
                            />
                        </button>
                    </div>
                </div>

                <DialogFooter className="mt-4 gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
                        キャンセル
                    </Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!isFormValid || saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                    >
                        {saveMutation.isPending ? '保存中…' : '保存'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
