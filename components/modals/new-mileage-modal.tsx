'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { createMileage, updateMileage, deleteMileage } from '@/app/actions/mileage.actions';

interface Props {
    vehicleId: string;
    open: boolean;
    onClose: () => void;
    editingMileage?: any | null;
}

export function NewMileageModal({ vehicleId, open, onClose, editingMileage }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        record_date: '',
        mileage: '',
    });

    useEffect(() => {
        if (editingMileage) {
            setForm({
                record_date: editingMileage.recordDate || '',
                mileage: editingMileage.mileage ? String(editingMileage.mileage) : '',
            });
        } else {
            setForm({ record_date: '', mileage: '' });
        }
    }, [editingMileage, open]);

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    const mutation = useMutation({
        mutationFn: async () => {
            if (editingMileage) {
                await updateMileage(vehicleId, editingMileage.id, form);
            } else {
                await createMileage(vehicleId, form);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!editingMileage) return;
            if (!confirm('この走行距離情報を削除してもよろしいですか？')) throw new Error('Cancelled');
            await deleteMileage(vehicleId, editingMileage.id);
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
                    <DialogTitle>{editingMileage ? '走行距離情報の編集' : '走行距離情報を追加'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">観測日 <span className="text-red-500">*</span></label>
                        <Input type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">走行距離 (km)</label>
                        <Input type="number" placeholder="150" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
                    </div>

                </div>

                <DialogFooter className="mt-4 flex sm:justify-between items-center sm:gap-0 gap-3">
                    {editingMileage ? (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending || mutation.isPending}>
                            <Trash2 className="w-4 h-4 mr-1.5" /> 削除
                        </Button>
                    ) : <div></div>}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>キャンセル</Button>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={!form.record_date || !form.mileage}
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending ? '保存中…' : editingMileage ? '更新する' : '追加する'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}