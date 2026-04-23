'use client';
import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateRealEstate, deleteRealEstate } from '@/app/actions/real-estate.actions';

interface Props {
    open: boolean;
    onClose: () => void;
    estate: any;
}

export function EditRealEstateModal({ open, onClose, estate }: Props) {
    const [form, setForm] = useState({
        name: '',
        address: '',
        ownershipType: 'leased',
        usageType: 'オフィス',
        floorArea: '',
        contract: {
            monthlyRent: '',
            landlord: '',
            startDate: '',
            endDate: ''
        }
    });

    useEffect(() => {
        if (estate) {
            setForm({
                name: estate.name || '',
                address: estate.address || '',
                ownershipType: estate.ownershipType || 'leased',
                usageType: estate.usages?.[0]?.type || 'オフィス',
                floorArea: estate.usages?.[0]?.floorArea ? String(estate.usages[0].floorArea) : '',
                contract: estate.contract ? {
                    monthlyRent: estate.contract.monthlyRent ? String(estate.contract.monthlyRent) : '',
                    landlord: estate.contract.landlord || '',
                    startDate: estate.contract.startDate || '',
                    endDate: estate.contract.endDate || ''
                } : {
                    monthlyRent: '',
                    landlord: '',
                    startDate: '',
                    endDate: ''
                }
            });
        }
    }, [estate]);

    const [isPending, startTransition] = useTransition();

    const onSubmit = () => {
        if (!estate) return;
        startTransition(async () => {
            try {
                await updateRealEstate(estate.id, form);
                onClose();
            } catch (err) {
                console.error("Failed to update real estate", err);
            }
        });
    };

    const onDelete = () => {
        if (!estate) return;
        if (!confirm('この不動産を削除しますか？\n付随する契約情報などもすべて削除されます。')) return;

        startTransition(async () => {
            try {
                await deleteRealEstate(estate.id);
                onClose();
            } catch (err) {
                console.error("Failed to delete real estate", err);
            }
        });
    };

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md h-[90vh] sm:h-auto overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>不動産の編集</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">物件名 <span className="text-red-500">*</span></label>
                        <Input placeholder="本社オフィス" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">住所 <span className="text-red-500">*</span></label>
                        <Input placeholder="東京都新宿区西新宿2-8-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">利用用途</label>
                            <Select value={form.usageType} onValueChange={set('usageType')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['オフィス', '倉庫', '駐車場', '店舗', 'その他'].map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">床面積（m²）</label>
                            <Input type="number" placeholder="100" value={form.floorArea} onChange={(e) => setForm({ ...form, floorArea: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">保有形態</label>
                        <Select value={form.ownershipType} onValueChange={set('ownershipType')}>
                            <SelectTrigger><SelectValue placeholder="選択">{form.ownershipType === 'owned' ? '自社保有' : form.ownershipType === 'leased' ? '賃借' : ''}</SelectValue></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="leased">賃借</SelectItem>
                                <SelectItem value="owned">自社保有</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {form.ownershipType === 'leased' && (
                        <div className="pt-4 border-t border-border space-y-4">
                            <h4 className="text-sm font-semibold text-brand-600">契約情報</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">家主・貸主</label>
                                    <Input placeholder="〇〇不動産" value={form.contract.landlord} onChange={(e) => setForm({ ...form, contract: { ...form.contract, landlord: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">月額 (円) <span className="text-red-500">*</span></label>
                                    <Input type="number" placeholder="200000" value={form.contract.monthlyRent} onChange={(e) => setForm({ ...form, contract: { ...form.contract, monthlyRent: e.target.value } })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">契約開始日 <span className="text-red-500">*</span></label>
                                    <Input type="date" value={form.contract.startDate} onChange={(e) => setForm({ ...form, contract: { ...form.contract, startDate: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">契約終了日</label>
                                    <Input type="date" value={form.contract.endDate} onChange={(e) => setForm({ ...form, contract: { ...form.contract, endDate: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
                    <Button variant="destructive" onClick={onDelete} disabled={isPending} className="sm:mr-auto">削除</Button>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose}>キャンセル</Button>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={!form.name || !form.address || (form.ownershipType === 'leased' && (!form.contract.monthlyRent || !form.contract.startDate)) || isPending}
                            onClick={onSubmit}
                        >
                            {isPending ? '保存中…' : '更新する'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
