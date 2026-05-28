'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { createInspection, updateInspection, deleteInspection } from '@/app/actions/inspection.actions';
import { InspectionType, InspectionTypeLabel } from '@/types';

interface Props {
    vehicleId: string;
    open: boolean;
    onClose: () => void;
    editingInspection?: any | null;
}

export function InspectionModal({ vehicleId, open, onClose, editingInspection }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        accidents_id: '',
        inspection_type: '',
        inspection_start_date: '',
        inspection_end_date: '',
        inspection_cost: '',
        next_inspection_mileage: '',
        next_inspection_date: '',
        notes: '',
    });

    useEffect(() => {
        if (editingInspection) {
            setForm({
                accidents_id: editingInspection.accidentsId || '',
                inspection_type: editingInspection.inspectionType || '',
                inspection_start_date: editingInspection.inspectionStartDate || '',
                inspection_end_date: editingInspection.inspectionEndDate || '',
                inspection_cost: editingInspection.inspectionCost ? String(editingInspection.inspectionCost) : '',
                next_inspection_mileage: editingInspection.nextInspectionMileage ? String(editingInspection.nextInspectionMileage) : '',
                next_inspection_date: editingInspection.nextInspectionDate || '',
                notes: editingInspection.notes || '',
            });
        } else {
            setForm({
                accidents_id: '',
                inspection_type: '',
                inspection_start_date: '',
                inspection_end_date: '',
                inspection_cost: '',
                next_inspection_mileage: '',
                next_inspection_date: '',
                notes: '',
            });
        }
    }, [editingInspection, open]);

    const mutation = useMutation({
        mutationFn: async () => {
            if (editingInspection) {
                await updateInspection(vehicleId, editingInspection.id, form);
            } else {
                await createInspection(vehicleId, form);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!editingInspection) return;
            if (!confirm('この点検情報を削除してもよろしいですか？')) throw new Error('Cancelled');
            await deleteInspection(vehicleId, editingInspection.id);
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
                    <DialogTitle>{editingInspection ? '点検情報の編集' : '点検情報を追加'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">点検区分 <span className="text-red-500">*</span></label>
                        <Select
                            value={form.inspection_type}
                            onValueChange={(v) => setForm({ ...form, inspection_type: v ?? '' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="点検区分を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(InspectionTypeLabel).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">点検開始日 <span className="text-red-500">*</span></label>
                            <Input
                                type="date"
                                value={form.inspection_start_date}
                                onChange={(e) => setForm({ ...form, inspection_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">点検終了日</label>
                            <Input
                                type="date"
                                value={form.inspection_end_date}
                                onChange={(e) => setForm({ ...form, inspection_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">費用 (円)</label>
                            <Input
                                type="number"
                                placeholder="10000"
                                value={form.inspection_cost}
                                onChange={(e) => setForm({ ...form, inspection_cost: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">次回点検目安距離 (km)</label>
                            <Input
                                type="number"
                                placeholder="50000"
                                value={form.next_inspection_mileage}
                                onChange={(e) => setForm({ ...form, next_inspection_mileage: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">次回点検目安日</label>
                        <Input
                            type="date"
                            value={form.next_inspection_date}
                            onChange={(e) => setForm({ ...form, next_inspection_date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">備考</label>
                        <Input
                            placeholder="オイルエレメントも交換"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4 flex sm:justify-between items-center sm:gap-0 gap-3">
                    {editingInspection ? (
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending || mutation.isPending}
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" /> 削除
                        </Button>
                    ) : <div></div>}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>キャンセル</Button>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={!form.inspection_type || !form.inspection_start_date || mutation.isPending}
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending ? '保存中…' : editingInspection ? '更新する' : '追加する'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
