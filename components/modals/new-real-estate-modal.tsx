'use client';
import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props { open: boolean; onClose: () => void; }

export function NewRealEstateModal({ open, onClose }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        name: '',
        address: '',
        ownershipType: 'leased',
        usageType: 'オフィス',
        floorArea: '',
    });

    const mutation = useMutation({
        mutationFn: async () => {
            await fetch('/api/real-estates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['real-estates'] });
            onClose();
            setForm({ name: '', address: '', ownershipType: 'leased', usageType: 'オフィス', floorArea: '' });
        },
    });

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
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
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="leased">賃借</SelectItem>
                                <SelectItem value="owned">自社保有</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.name || !form.address || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '登録する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
