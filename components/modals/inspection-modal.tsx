'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CalendarDays } from 'lucide-react';
import { createInspection, updateInspection, deleteInspection } from '@/app/actions/inspection.actions';
import { InspectionType, InspectionTypeLabel } from '@/types';

interface Props {
    vehicleId: string;
    open: boolean;
    onClose: () => void;
    editingInspection?: any | null;
    accidents?: any[];
}

const severityMap = {
    low: { label: '軽微', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
    medium: { label: '中程度', class: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' },
    high: { label: '重大', class: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
};

export function InspectionModal({ vehicleId, open, onClose, editingInspection, accidents = [] }: Props) {
    const qc = useQueryClient();
    const [showSelectAccident, setShowSelectAccident] = useState(false);
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
        <>
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
                                <SelectValue placeholder="点検区分を選択">
                                    {form.inspection_type ? InspectionTypeLabel[form.inspection_type as keyof typeof InspectionTypeLabel] : ''}
                                </SelectValue>
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
                            <label className="text-sm font-medium mb-1.5 block">点検終了日 <span className="text-red-500">*</span></label>
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

                    <div className="border-t pt-4 space-y-3">
                        <label className="text-sm font-medium block">関連する事故情報</label>
                        {form.accidents_id ? (
                            (() => {
                                const acc = accidents.find((a: any) => a.id === form.accidents_id);
                                return acc ? (
                                    <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-start justify-between gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                <span>
                                                    {acc.accidentDate ? new Date(acc.accidentDate).toLocaleDateString('ja-JP') : '—'}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityMap[acc.severity as keyof typeof severityMap]?.class || ''}`}>
                                                    {severityMap[acc.severity as keyof typeof severityMap]?.label || '不明'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{acc.description}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2.5"
                                            onClick={() => setForm({ ...form, accidents_id: '' })}
                                        >
                                            解除
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">紐付けられた事故が見つかりません</p>
                                );
                            })()
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs gap-1.5"
                                onClick={() => setShowSelectAccident(true)}
                            >
                                事故情報を紐付ける
                            </Button>
                        )}
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
                            disabled={!form.inspection_type || !form.inspection_start_date || !form.inspection_end_date || mutation.isPending}
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending ? '保存中…' : editingInspection ? '更新する' : '追加する'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={showSelectAccident} onOpenChange={(v) => !v && setShowSelectAccident(false)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>紐付ける事故を選択</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 py-2">
                    {accidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-12">事故情報の記録はありません</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {accidents.map((acc: any) => (
                                <div key={acc.id} className="py-3 flex flex-col gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityMap[acc.severity as keyof typeof severityMap]?.class || ''}`}>
                                                {severityMap[acc.severity as keyof typeof severityMap]?.label || '不明'}
                                            </span>
                                            {acc.repairCost && (
                                                <span className="text-xs text-muted-foreground">
                                                    修理費用: ¥{Number(acc.repairCost).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                            onClick={() => {
                                                setForm({ ...form, accidents_id: acc.id });
                                                setShowSelectAccident(false);
                                            }}
                                        >
                                            選択
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-1.5 font-mono">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>
                                                事故日: {acc.accidentDate ? new Date(acc.accidentDate).toLocaleDateString('ja-JP') : '—'}
                                            </span>
                                        </div>
                                        {(acc.isBodilyInjury || acc.isPropertyDamage) && (
                                            <div className="flex gap-2 mt-1">
                                                {acc.isBodilyInjury && (
                                                    <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5 rounded">
                                                        対人
                                                    </span>
                                                )}
                                                {acc.isPropertyDamage && (
                                                    <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0.5 rounded">
                                                        対物
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {acc.description && (
                                            <div className="text-slate-700 dark:text-slate-300 font-medium text-sm mt-1">
                                                {acc.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setShowSelectAccident(false)} className="w-full sm:w-auto">
                        キャンセル
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
