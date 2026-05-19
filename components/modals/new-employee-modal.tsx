'use client';
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmploymentCategoryLabel } from '@/types';

interface Props { open: boolean; onClose: () => void; }

export function NewEmployeeModal({ open, onClose }: Props) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ name: '', name_kana: '', birthDate: '', companyId: '', branchId: '', lineId: '', email: '', tel: '', address: '', emergencyContact: '', hireDate: '', category: 'full_time', hourlyRate: '1085', certificationNum: '', invoiceNum: '', weeklyHoursMin: '', weeklyHoursMax: '' });

    // テナント一覧（全会社）を取得
    const { data: dbCompanies = [] } = useQuery<any[]>({
        queryKey: ['tenants', 'all'],
        queryFn: async () => {
            const res = await fetch('/api/tenants?all=true');
            if (!res.ok) throw new Error('Failed to fetch tenants');
            return res.json();
        },
        enabled: open,
    });

    // 支社一覧を取得
    const { data: dbBranches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetch('/api/branches');
            if (!res.ok) throw new Error('Failed to fetch branches');
            return res.json();
        },
        enabled: open,
    });

    // 会社が変更されたら、選択済みの支社をリセット
    useEffect(() => {
        setForm((f) => ({ ...f, branchId: '' }));
    }, [form.companyId]);

    // 選択された会社に属する支社をフィルタリング
    const filteredBranches = dbBranches.filter(
        (b: any) => b.tenant_id === form.companyId
    );

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
            setForm({ name: '', name_kana: '', birthDate: '', companyId: '', branchId: '', lineId: '', email: '', tel: '', address: '', emergencyContact: '', hireDate: '', category: 'full_time', hourlyRate: '1085', certificationNum: '', invoiceNum: '', weeklyHoursMin: '', weeklyHoursMax: '' });
        },
    });

    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>社員を新規追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">氏名 <span className="text-red-500">*</span></label>
                        <Input placeholder="山田 太郎" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">氏名（カナ） <span className="text-red-500">*</span></label>
                        <Input placeholder="ヤマダ タロウ" value={form.name_kana} onChange={(e) => setForm({ ...form, name_kana: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">生年月日 <span className="text-red-500">*</span></label>
                        <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">所属会社 <span className="text-red-500">*</span></label>
                            <Select value={form.companyId} onValueChange={set('companyId')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="会社を選択">
                                        {dbCompanies.find((c: any) => c.id === form.companyId)?.name || ''}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {dbCompanies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">所属支社</label>
                            <Select
                                value={form.branchId}
                                onValueChange={set('branchId')}
                                disabled={!form.companyId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={form.companyId ? "支社を選択" : "先に会社を選択してください"}>
                                        {filteredBranches.find((b: any) => b.id === form.branchId)?.name || ''}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredBranches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">メールアドレス <span className="text-red-500">*</span></label>
                        <Input type="email" placeholder="yamada@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">電話番号 <span className="text-red-500">*</span></label>
                        <Input type="tel" placeholder="090-1234-5678" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">LINE ID</label>
                        <Input type="lineId" placeholder="" value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">住所 <span className="text-red-500">*</span></label>
                        <Input type="address" placeholder="" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">緊急連絡先 <span className="text-red-500">*</span></label>
                        <Input type="emergencyContact" placeholder="090-1234-5678" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">入社日 <span className="text-red-500">*</span></label>
                            <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
                        </div>

                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">雇用区分 <span className="text-red-500">*</span></label>
                            <Select value={form.category} onValueChange={set('category')}>
                                <SelectTrigger><SelectValue placeholder="選択">{form.category ? EmploymentCategoryLabel[form.category as keyof typeof EmploymentCategoryLabel] : ''}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EmploymentCategoryLabel).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {(form.category === 'part_time' || form.category === 'dispatch') && (
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">時給 <span className="text-red-500">*</span></label>
                                <Input
                                    type="number"
                                    placeholder="1000"
                                    value={form.hourlyRate}
                                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">認定番号</label>
                        <Input type="certificationNum" placeholder="" value={form.certificationNum} onChange={(e) => setForm({ ...form, certificationNum: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">INVOICE番号</label>
                        <Input type="invoiceNum" placeholder="" value={form.invoiceNum} onChange={(e) => setForm({ ...form, invoiceNum: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium block">週稼働予定時間 <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="number"
                                    className="w-20"
                                    placeholder="20"
                                    value={form.weeklyHoursMin}
                                    onChange={(e) => setForm({ ...form, weeklyHoursMin: e.target.value })}
                                />
                                <span className="text-xs text-muted-foreground">時間</span>
                            </div>
                            <span className="text-muted-foreground">～</span>
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="number"
                                    className="w-20"
                                    placeholder="40"
                                    value={form.weeklyHoursMax}
                                    onChange={(e) => setForm({ ...form, weeklyHoursMax: e.target.value })}
                                />
                                <span className="text-xs text-muted-foreground">時間</span>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.name || !form.name_kana || !form.birthDate || !form.companyId || !form.email || !form.address || !form.emergencyContact || !form.category || ((form.category === 'part_time' || form.category === 'dispatch') ? !form.hourlyRate : false) || !form.weeklyHoursMax || !form.weeklyHoursMin || !form.hireDate || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '追加する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
