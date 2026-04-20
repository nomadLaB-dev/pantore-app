'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InsuranceTypeLabel } from '@/types';

import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { createInsurance, updateInsurance, deleteInsurance } from '@/app/actions/insurance.actions';

interface Props {
    vehicleId: string;
    open: boolean;
    onClose: () => void;
    editingInsurance?: any | null;
}

export function InsuranceModal({ vehicleId, open, onClose, editingInsurance }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        type: 'compulsory',
        companyName: '',
        startDate: '',
        endDate: '',
        premiumAmount: '',
        coverageDetails: '',
    });

    useEffect(() => {
        if (editingInsurance) {
            setForm({
                type: editingInsurance.type,
                companyName: editingInsurance.companyName || '',
                startDate: new Date(editingInsurance.startDate).toISOString().split('T')[0],
                endDate: new Date(editingInsurance.endDate).toISOString().split('T')[0],
                premiumAmount: editingInsurance.premiumAmount ? String(editingInsurance.premiumAmount) : '',
                coverageDetails: editingInsurance.coverageDetails || '',
            });
        } else {
            setForm({ type: 'compulsory', companyName: '', startDate: '', endDate: '', premiumAmount: '', coverageDetails: '' });
        }
    }, [editingInsurance, open]);

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    const mutation = useMutation({
        mutationFn: async () => {
            if (editingInsurance) {
                await updateInsurance(vehicleId, editingInsurance.id, form);
            } else {
                await createInsurance(vehicleId, form);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!editingInsurance) return;
            if (!confirm('この保険情報を削除してもよろしいですか？')) throw new Error('Cancelled');
            await deleteInsurance(vehicleId, editingInsurance.id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingInsurance ? '保険情報の編集' : '保険情報を追加'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">保険区分 <span className="text-red-500">*</span></label>
                        <Select value={form.type} onValueChange={set('type')}>
                            <SelectTrigger><SelectValue placeholder="選択">{form.type ? InsuranceTypeLabel[form.type as keyof typeof InsuranceTypeLabel] : ''}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(InsuranceTypeLabel).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">保険会社など <span className="text-red-500">*</span></label>
                        <Input placeholder="損害保険ジャパン" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">契約開始日 <span className="text-red-500">*</span></label>
                            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">契約終了日 <span className="text-red-500">*</span></label>
                            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-sm font-medium mb-1.5 block">保険料</label>
                            <Input type="number" placeholder="45000" value={form.premiumAmount} onChange={(e) => setForm({ ...form, premiumAmount: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">補償内容（メモ）</label>
                        <Input placeholder="対人・対物無制限、など" value={form.coverageDetails} onChange={(e) => setForm({ ...form, coverageDetails: e.target.value })} />
                    </div>
                </div>

                <DialogFooter className="mt-4 flex sm:justify-between items-center sm:gap-0 gap-3">
                    {editingInsurance ? (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending || mutation.isPending}>
                            <Trash2 className="w-4 h-4 mr-1.5" /> 削除
                        </Button>
                    ) : <div></div>}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>キャンセル</Button>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={!form.type || !form.companyName || !form.startDate || !form.endDate || mutation.isPending || deleteMutation.isPending}
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending ? '保存中…' : editingInsurance ? '更新する' : '追加する'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
