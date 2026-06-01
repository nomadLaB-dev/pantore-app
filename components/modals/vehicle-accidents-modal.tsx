'use client';
import { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createVehicleAccident, updateVehicleAccident, deleteAccidents } from '@/app/actions/vehicle.actions';
import { createInspection } from '@/app/actions/inspection.actions';
import { InspectionTypeLabel } from '@/types';

interface Props {
    vehicleId: string;
    v_accidentsId: string;
    record?: any;   // null = adding new
    open: boolean;
    onClose: () => void;
}

const empty = {
    accident_date: '',
    description: '',
    severity: 'low',
    repair_cost: '',
    created_at: '',
    updated_at: '',
    is_bodily_injury: false,
    is_property_damage: false,
};

const emptyRepair = {
    accidents_id: '',
    inspection_type: '',
    inspection_start_date: '',
    inspection_end_date: '',
    inspection_cost: '',
    next_inspection_mileage: '',
    next_inspection_date: '',
    notes: '',
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toISOString().slice(0, 10);
    } catch {
        return '';
    }
}

export function VehicleAccidentsModal({ vehicleId, v_accidentsId, record, open, onClose }: Props) {
    const qc = useQueryClient();
    const isEdit = !!record;
    const [form, setForm] = useState(empty);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [addRepair, setAddRepair] = useState(false);
    const [repairForm, setRepairForm] = useState(emptyRepair);

    useEffect(() => {
        if (open) {
            setErrorMsg(null);
            if (record) {
                setForm({
                    accident_date: record.accidentDate ? formatDate(record.accidentDate) : '',
                    description: record.description || '',
                    severity: record.severity || 'low',
                    repair_cost: record.repairCost ? String(record.repairCost) : '',
                    created_at: record.createdAt || '',
                    updated_at: record.updatedAt || '',
                    is_bodily_injury: record.isBodilyInjury || false,
                    is_property_damage: record.isPropertyDamage || false,
                });
            } else {
                setForm(empty);
            }
            setRepairForm(emptyRepair);
            setAddRepair(false);
        }
    }, [record, open]);

    const mutation = useMutation({
        mutationFn: async () => {
            if (isEdit) {
                await updateVehicleAccident(vehicleId, v_accidentsId, form);
            } else {
                const accident = await createVehicleAccident(vehicleId, form);
                if (addRepair) {
                    await createInspection(vehicleId, {
                        ...repairForm,
                        accidents_id: accident.id,
                    });
                }
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
            setForm(empty);
            setRepairForm(emptyRepair);
            setAddRepair(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!isEdit) return;
            if (!confirm('この事故情報を削除してもよろしいですか？')) throw new Error('Cancelled');
            await deleteAccidents(vehicleId, v_accidentsId);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
        },
    });

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '事故情報を編集' : '事故情報を追加'}</DialogTitle>
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

                <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto pr-1">

                    <div className="grid grid-cols-1 gap-4">
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">
                                事故日
                            </label>
                            <Input
                                type="date"
                                value={form.accident_date}
                                onChange={(e) => setForm({ ...form, accident_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                事故詳細
                            </label>
                            <Input
                                placeholder="衝突、接触事故等"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                重要度
                            </label>
                            <Select
                                value={form.severity}
                                onValueChange={(v) => setForm({ ...form, severity: v as 'low' | 'medium' | 'high' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="重要度を選択">
                                        {form.severity === 'low' ? '軽微' : form.severity === 'medium' ? '中程度' : form.severity === 'high' ? '重大' : ''}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">軽微</SelectItem>
                                    <SelectItem value="medium">中程度</SelectItem>
                                    <SelectItem value="high">重大</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                修理費用（円）
                            </label>
                            <Input
                                type="number"
                                placeholder="50000"
                                value={form.repair_cost}
                                onChange={(e) => setForm({ ...form, repair_cost: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="checkbox"
                                id="isBodilyInjury"
                                checked={form.is_bodily_injury}
                                onChange={(e) => {
                                    setForm({ ...form, is_bodily_injury: e.target.checked });
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer mr-2"
                            />
                            <label htmlFor="isBodilyInjury" className="text-sm font-medium cursor-pointer select-none">
                                対人
                            </label>
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                id="isPropertyDamage"
                                checked={form.is_property_damage}
                                onChange={(e) => {
                                    setForm({ ...form, is_property_damage: e.target.checked });
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer mr-2"
                            />
                            <label htmlFor="isPropertyDamage" className="text-sm font-medium cursor-pointer select-none">
                                対物
                            </label>
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="flex items-center justify-between border-t pt-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                修理情報追加
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={addRepair}
                                    onChange={(e) => setAddRepair(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                            </label>
                        </div>
                    )}

                    {!isEdit && addRepair && (
                        <div className="border-t pt-4 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">修理情報</h4>
                            
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">点検区分 <span className="text-red-500">*</span></label>
                                <Select
                                    value={repairForm.inspection_type}
                                    onValueChange={(v) => setRepairForm({ ...repairForm, inspection_type: v ?? '' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="点検区分を選択">
                                            {repairForm.inspection_type ? InspectionTypeLabel[repairForm.inspection_type as keyof typeof InspectionTypeLabel] : ''}
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
                                        value={repairForm.inspection_start_date}
                                        onChange={(e) => setRepairForm({ ...repairForm, inspection_start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">点検終了日 <span className="text-red-500">*</span></label>
                                    <Input
                                        type="date"
                                        value={repairForm.inspection_end_date}
                                        onChange={(e) => setRepairForm({ ...repairForm, inspection_end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">費用 (円)</label>
                                    <Input
                                        type="number"
                                        placeholder="10000"
                                        value={repairForm.inspection_cost}
                                        onChange={(e) => setRepairForm({ ...repairForm, inspection_cost: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">次回点検目安距離 (km)</label>
                                    <Input
                                        type="number"
                                        placeholder="50000"
                                        value={repairForm.next_inspection_mileage}
                                        onChange={(e) => setRepairForm({ ...repairForm, next_inspection_mileage: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">次回点検目安日</label>
                                <Input
                                    type="date"
                                    value={repairForm.next_inspection_date}
                                    onChange={(e) => setRepairForm({ ...repairForm, next_inspection_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">備考</label>
                                <Input
                                    placeholder="修理内容などの詳細"
                                    value={repairForm.notes}
                                    onChange={(e) => setRepairForm({ ...repairForm, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 flex sm:justify-between items-center sm:gap-0 gap-3">
                    {isEdit ? (
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
                            disabled={
                                !form.accident_date ||
                                !form.severity ||
                                mutation.isPending ||
                                (addRepair && (!repairForm.inspection_type || !repairForm.inspection_start_date || !repairForm.inspection_end_date))
                            }
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending ? '保存中…' : isEdit ? '更新する' : '追加する'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
