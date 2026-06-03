'use client';
import { useState, useTransition, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createRealEstate } from '@/app/actions/real-estate.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    open: boolean;
    onClose: () => void;
    masters: {
        tenants: { id: string; name: string }[];
        branches: { id: string; name: string }[];
        usageTypes: string[];
        registrationStatuses: string[];
    };
}

const usageTypeLabels: Record<string, string> = {
    'office': '事務所',
    'commercial_office': 'オフィス',
    'warehouse': '倉庫',
    'parking_lot': '駐車場',
    'other': 'その他'
};

const regStatusLabels: Record<string, string> = {
    'not_applied': '未申請',
    'not_required': '申請不要',
    'applied': '申請済み'
};

export function NewRealEstateModal({ open, onClose, masters }: Props) {
    const [form, setForm] = useState({
        tenantId: '',
        branchesId: 'none',
        officeRegistrationStatus: 'not_applied',
        name: '',
        address: '',
        ownershipType: 'leased',
        usageType: 'office',
        floorArea: '',
        contract: {
            monthlyRent: '',
            landlord: '',
            startDate: '',
            endDate: ''
        },
        restFacility: {
            isAttachedToOffice: true,
            address: '',
            landlord: '',
            monthlyRent: '',
            startDate: '',
            endDate: ''
        },
        garage: {
            isAttachedToOffice: true,
            address: '',
            landlord: '',
            monthlyRent: '',
            capacity: '',
            startDate: '',
            endDate: ''
        }
    });

    useEffect(() => {
        if (open) {
            setForm({
                tenantId: masters.tenants[0]?.id || '',
                branchesId: 'none',
                officeRegistrationStatus: 'not_applied',
                name: '',
                address: '',
                ownershipType: 'leased',
                usageType: 'office',
                floorArea: '',
                contract: { monthlyRent: '', landlord: '', startDate: '', endDate: '' },
                restFacility: { isAttachedToOffice: true, address: '', landlord: '', monthlyRent: '', startDate: '', endDate: '' },
                garage: { isAttachedToOffice: true, address: '', landlord: '', monthlyRent: '', capacity: '', startDate: '', endDate: '' }
            });
        }
    }, [open, masters]);

    const [isPending, startTransition] = useTransition();

    const onSubmit = () => {
        startTransition(async () => {
            try {
                const submitData = {
                    ...form,
                    branchesId: form.branchesId === 'none' ? null : form.branchesId
                };
                await createRealEstate(submitData);
                onClose();
            } catch (err) {
                console.error("Failed to create real estate", err);
            }
        });
    };

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>不動産を新規登録</DialogTitle>
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
                                <SelectTrigger>
                                    <SelectValue>
                                        {usageTypeLabels[form.usageType] || form.usageType}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {masters.usageTypes.map((t) => (
                                        <SelectItem key={t} value={t}>{usageTypeLabels[t] || t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">床面積（m²）</label>
                            <Input type="number" placeholder="100" value={form.floorArea} onChange={(e) => setForm({ ...form, floorArea: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">会社</label>
                            <Select value={form.tenantId} onValueChange={set('tenantId')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="会社を選択">
                                        {masters.tenants.find((t) => t.id === form.tenantId)?.name || '会社を選択'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {masters.tenants.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">支社</label>
                            <Select value={form.branchesId} onValueChange={set('branchesId')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="支社を選択">
                                        {form.branchesId === 'none' ? '選択なし' : (masters.branches.find((b) => b.id === form.branchesId)?.name || '支社を選択')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">選択なし</SelectItem>
                                    {masters.branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">申請ステータス</label>
                            <Select value={form.officeRegistrationStatus} onValueChange={set('officeRegistrationStatus')}>
                                <SelectTrigger>
                                    <SelectValue>
                                        {regStatusLabels[form.officeRegistrationStatus] || form.officeRegistrationStatus}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {masters.registrationStatuses.map((s) => (
                                        <SelectItem key={s} value={s}>{regStatusLabels[s] || s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                                    <label className="text-sm font-medium mb-1.5 block">契約終了日 <span className="text-red-500">*</span></label>
                                    <Input type="date" value={form.contract.endDate} onChange={(e) => setForm({ ...form, contract: { ...form.contract, endDate: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 休憩所情報（利用用途が事務所 office の場合のみ表示） */}
                    {form.usageType === 'office' && (
                        <div className="pt-4 border-t border-border space-y-4">
                            <h4 className="text-sm font-semibold text-brand-600">休憩所情報</h4>
                            <div className="flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.restFacility.isAttachedToOffice}
                                        onChange={(e) => setForm({
                                            ...form,
                                            restFacility: { ...form.restFacility, isAttachedToOffice: e.target.checked }
                                        })}
                                    />
                                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                                    <span className="ml-2 text-sm font-medium text-muted-foreground">事務所と同じ</span>
                                </label>
                            </div>

                            {!form.restFacility.isAttachedToOffice && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">住所</label>
                                        <Input placeholder="住所を入力" value={form.restFacility.address} onChange={(e) => setForm({ ...form, restFacility: { ...form.restFacility, address: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">家主・貸主</label>
                                            <Input placeholder="家主・貸主名" value={form.restFacility.landlord} onChange={(e) => setForm({ ...form, restFacility: { ...form.restFacility, landlord: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">月額 (円)</label>
                                            <Input type="number" placeholder="月額" value={form.restFacility.monthlyRent} onChange={(e) => setForm({ ...form, restFacility: { ...form.restFacility, monthlyRent: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">契約開始日</label>
                                            <Input type="date" value={form.restFacility.startDate} onChange={(e) => setForm({ ...form, restFacility: { ...form.restFacility, startDate: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">契約終了日</label>
                                            <Input type="date" value={form.restFacility.endDate} onChange={(e) => setForm({ ...form, restFacility: { ...form.restFacility, endDate: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 駐車場情報（利用用途が事務所 office の場合のみ表示） */}
                    {form.usageType === 'office' && (
                        <div className="pt-4 border-t border-border space-y-4">
                            <h4 className="text-sm font-semibold text-brand-600">駐車場情報</h4>
                            <div className="flex items-center justify-between gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.garage.isAttachedToOffice}
                                        onChange={(e) => setForm({
                                            ...form,
                                            garage: { ...form.garage, isAttachedToOffice: e.target.checked }
                                        })}
                                    />
                                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                                    <span className="ml-2 text-sm font-medium text-muted-foreground">事務所と同じ</span>
                                </label>

                                <div className="flex items-center gap-2 shrink-0">
                                    <label className="text-sm font-medium text-muted-foreground">収容台数</label>
                                    <Input
                                        type="number"
                                        placeholder="5"
                                        className="w-20 h-8"
                                        value={form.garage.capacity}
                                        onChange={(e) => setForm({ ...form, garage: { ...form.garage, capacity: e.target.value } })}
                                    />
                                </div>
                            </div>

                            {!form.garage.isAttachedToOffice && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">住所</label>
                                        <Input placeholder="住所を入力" value={form.garage.address} onChange={(e) => setForm({ ...form, garage: { ...form.garage, address: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">家主・貸主</label>
                                            <Input placeholder="家主・貸主名" value={form.garage.landlord} onChange={(e) => setForm({ ...form, garage: { ...form.garage, landlord: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">月額 (円)</label>
                                            <Input type="number" placeholder="月額" value={form.garage.monthlyRent} onChange={(e) => setForm({ ...form, garage: { ...form.garage, monthlyRent: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">契約開始日</label>
                                            <Input type="date" value={form.garage.startDate} onChange={(e) => setForm({ ...form, garage: { ...form.garage, startDate: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">契約終了日</label>
                                            <Input type="date" value={form.garage.endDate} onChange={(e) => setForm({ ...form, garage: { ...form.garage, endDate: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.name || !form.address || (form.ownershipType === 'leased' && (!form.contract.monthlyRent || !form.contract.startDate || !form.contract.endDate)) || isPending}
                        onClick={onSubmit}
                    >
                        {isPending ? '保存中…' : '登録する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
