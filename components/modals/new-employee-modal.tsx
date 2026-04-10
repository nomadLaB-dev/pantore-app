'use client';
import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmploymentCategoryLabel } from '@/types';

interface Props { open: boolean; onClose: () => void; }

const branches = [
    { id: 'b1', name: '本社' },
    { id: 'b2', name: '大阪支社' },
    { id: 'b3', name: '横浜倉庫・拠点' },
];

export function NewEmployeeModal({ open, onClose }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ name: '', email: '', hireDate: '', category: 'full_time', branchId: 'b1' });

    const mutation = useMutation({
        mutationFn: async () => {
            await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, leaveDate: null, accountStatus: 'none' }),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employees'] });
            onClose();
            setForm({ name: '', email: '', hireDate: '', category: 'full_time', branchId: 'b1' });
        },
    });

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>社員を新規追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">氏名 <span className="text-red-500">*</span></label>
                        <Input placeholder="山田 太郎" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">メールアドレス</label>
                        <Input type="email" placeholder="yamada@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">入社日 <span className="text-red-500">*</span></label>
                            <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">所属支社</label>
                            <Select value={form.branchId} onValueChange={set('branchId')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">雇用区分</label>
                        <Select value={form.category} onValueChange={set('category')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(EmploymentCategoryLabel).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.name || !form.hireDate || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '追加する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
