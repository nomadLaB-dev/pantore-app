'use client';
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LicensePlateColorLabel } from '@/types';

interface Branch {
    id: string;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    vehicle: any;
}

const plateColorStyle: Record<string, string> = {
    white: 'bg-white text-gray-800 border border-gray-300',
    yellow: 'bg-yellow-300 text-gray-800',
    green: 'bg-green-600 text-white',
    black: 'bg-gray-900 text-yellow-300',
};

export function EditVehicleModal({ open, onClose, vehicle }: Props) {
    const qc = useQueryClient();

    const { data: branchesRaw = [] } = useQuery<Branch[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetch('/api/branches');
            if (!res.ok) throw new Error('Failed to fetch branches');
            return res.json();
        },
        enabled: open,
    });

    const branches = Array.isArray(branchesRaw) ? branchesRaw : [];

    const [form, setForm] = useState({
        manufacturer: '',
        model: '',
        licensePlate: '',
        licensePlateColor: 'white',
        ownershipType: 'owned',
        branchId: '',
        lease: {
            leaseCompany: '',
            contractStartDate: '',
            contractEndDate: '',
            monthlyFee: ''
        }
    });

    useEffect(() => {
        if (vehicle) {
            setForm({
                manufacturer: vehicle.manufacturer || '',
                model: vehicle.model || '',
                licensePlate: vehicle.licensePlate || '',
                licensePlateColor: vehicle.licensePlateColor || 'white',
                ownershipType: vehicle.ownershipType || 'owned',
                branchId: vehicle.branchId || '',
                lease: vehicle.lease ? {
                    leaseCompany: vehicle.lease.leaseCompany || '',
                    contractStartDate: vehicle.lease.contractStartDate || '',
                    contractEndDate: vehicle.lease.contractEndDate || '',
                    monthlyFee: vehicle.lease.monthlyFee ? String(vehicle.lease.monthlyFee) : ''
                } : {
                    leaseCompany: '',
                    contractStartDate: '',
                    contractEndDate: '',
                    monthlyFee: ''
                }
            });
        }
    }, [vehicle]);

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/vehicles/${vehicle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Update failed');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
        },
    });

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>車両情報を編集</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">メーカー <span className="text-red-500">*</span></label>
                            <Input placeholder="TESLA" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">車種 <span className="text-red-500">*</span></label>
                            <Input placeholder="Model S" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">ナンバープレート</label>
                        <div className="flex gap-2 items-center">
                            <div className={`text-xs font-bold px-3 py-1.5 rounded font-mono shrink-0 ${plateColorStyle[form.licensePlateColor]}`}>
                                {form.licensePlate || '広島300あ12-34'}
                            </div>
                            <Input
                                placeholder="広島300あ12-34"
                                value={form.licensePlate}
                                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">ナンバーの色</label>
                            <Select value={form.licensePlateColor} onValueChange={set('licensePlateColor')}>
                                <SelectTrigger><SelectValue placeholder="選択">{form.licensePlateColor === 'white' ? '白（自家用普通車）' : form.licensePlateColor === 'yellow' ? '黄（自家用軽自動車）' : form.licensePlateColor === 'green' ? '緑（営業用普通車）' : form.licensePlateColor === 'black' ? '黒（営業用軽自動車）' : ''}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(LicensePlateColorLabel).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">保有形態</label>
                            <Select value={form.ownershipType} onValueChange={set('ownershipType')}>
                                <SelectTrigger><SelectValue placeholder="選択">{form.ownershipType === 'owned' ? '自社保有' : form.ownershipType === 'leased' ? 'リース' : ''}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owned">自社保有</SelectItem>
                                    <SelectItem value="leased">リース</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">配属支社</label>
                        <Select value={form.branchId} onValueChange={set('branchId')}>
                            <SelectTrigger><SelectValue placeholder="支社を選択">{branches.find((b: Branch) => b.id === form.branchId)?.name}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {branches.map((b: Branch) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {form.ownershipType === 'leased' && (
                        <div className="pt-4 border-t border-border space-y-4">
                            <h4 className="text-sm font-semibold text-brand-600">リース情報</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">リース会社</label>
                                    <Input placeholder="トヨタレンタリース" value={form.lease.leaseCompany} onChange={(e) => setForm({ ...form, lease: { ...form.lease, leaseCompany: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">月額料金 (円)</label>
                                    <Input type="number" placeholder="50000" value={form.lease.monthlyFee} onChange={(e) => setForm({ ...form, lease: { ...form.lease, monthlyFee: e.target.value } })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">契約開始日</label>
                                    <Input type="date" value={form.lease.contractStartDate} onChange={(e) => setForm({ ...form, lease: { ...form.lease, contractStartDate: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">契約終了日</label>
                                    <Input type="date" value={form.lease.contractEndDate} onChange={(e) => setForm({ ...form, lease: { ...form.lease, contractEndDate: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.manufacturer || !form.model || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '更新する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
