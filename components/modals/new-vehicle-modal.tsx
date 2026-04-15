'use client';
import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LicensePlateColorLabel } from '@/types';

interface Props { open: boolean; onClose: () => void; }

const plateColorStyle: Record<string, string> = {
    white: 'bg-white text-gray-800 border border-gray-300',
    yellow: 'bg-yellow-300 text-gray-800',
    green: 'bg-green-600 text-white',
    black: 'bg-gray-900 text-yellow-300',
};

const branches = [
    { id: 'b1', name: '本社' },
    { id: 'b2', name: '大阪支社' },
    { id: 'b3', name: '横浜倉庫・拠点' },
];

export function NewVehicleModal({ open, onClose }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        manufacturer: '',
        model: '',
        licensePlate: '',
        licensePlateColor: 'white',
        ownershipType: 'owned',
        branchId: 'b1',
    });

    const mutation = useMutation({
        mutationFn: async () => {
            await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
            setForm({ manufacturer: '', model: '', licensePlate: '', licensePlateColor: 'white', ownershipType: 'owned', branchId: 'b1' });
        },
    });

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>車両を新規登録</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">メーカー <span className="text-red-500">*</span></label>
                            <Input placeholder="トヨタ" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">車種 <span className="text-red-500">*</span></label>
                            <Input placeholder="ノア" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">ナンバープレート</label>
                        <div className="flex gap-2 items-center">
                            <div className={`text-xs font-bold px-3 py-1.5 rounded font-mono shrink-0 ${plateColorStyle[form.licensePlateColor]}`}>
                                {form.licensePlate || '品川300あ1234'}
                            </div>
                            <Input
                                placeholder="品川300あ1234"
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
                            <SelectTrigger><SelectValue placeholder="支社を選択">{branches.find((b: any) => b.id === form.branchId)?.name}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.manufacturer || !form.model || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '登録する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
