'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props { open: boolean; onClose: () => void; }

const branches = [
    { id: '', name: '全支社共通（未指定）' },
    { id: 'b1', name: '本社' },
    { id: 'b2', name: '大阪支社' },
    { id: 'b3', name: '横浜倉庫・拠点' },
];

export function NewSubscriptionModal({ open, onClose }: Props) {
    const qc = useQueryClient();

    const { data: employees = [] } = useQuery<any[]>({
        queryKey: ['employees'],
        queryFn: async () => (await fetch('/api/employees')).json(),
        enabled: open,
    });

    const [form, setForm] = useState({
        serviceName: '',
        serviceUrl: '',
        corporateName: '',
        branchId: '',
        assigneeEmployeeId: '',
        amount: '',
        currency: 'JPY',
        effectiveFrom: new Date().toISOString().slice(0, 10),
    });

    const set = (key: string) => (v: string | null) => v !== null && setForm((f) => ({ ...f, [key]: v }));

    const mutation = useMutation({
        mutationFn: async () => {
            const body = {
                serviceName: form.serviceName,
                serviceUrl: form.serviceUrl || null,
                corporateName: form.corporateName,
                branchId: form.branchId || null,
                assigneeEmployeeId: form.assigneeEmployeeId || null,
                currentCurrency: form.currency,
            };
            const res = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const created = await res.json();
            // Also add first price history if amount was set
            if (form.amount) {
                await fetch(`/api/subscriptions/${created.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseFloat(form.amount),
                        currency: form.currency,
                        effectiveFrom: form.effectiveFrom,
                        note: '初期設定',
                    }),
                });
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['subscriptions'] });
            onClose();
            setForm({ serviceName: '', serviceUrl: '', corporateName: '', branchId: '', assigneeEmployeeId: '', amount: '', currency: 'JPY', effectiveFrom: new Date().toISOString().slice(0, 10) });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>サブスクを新規登録</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                    {/* Service info */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">サービス情報</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">サービス名 <span className="text-red-500">*</span></label>
                                <Input placeholder="Notion" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">サービスURL</label>
                                <Input placeholder="https://notion.so" value={form.serviceUrl} onChange={(e) => setForm({ ...form, serviceUrl: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">法人名</label>
                            <Input placeholder="Notion Labs, Inc." value={form.corporateName} onChange={(e) => setForm({ ...form, corporateName: e.target.value })} />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-3 pt-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">月額料金</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-1.5 block">金額</label>
                                <Input type="number" placeholder="2500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">通貨</label>
                                <Select value={form.currency} onValueChange={set('currency')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="JPY">¥ JPY</SelectItem>
                                        <SelectItem value="USD">$ USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">適用開始日</label>
                            <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
                        </div>
                    </div>

                    {/* Attribution */}
                    <div className="space-y-3 pt-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">担当・支社</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">使用支社</label>
                                <Select value={form.branchId} onValueChange={set('branchId')}>
                                    <SelectTrigger><SelectValue placeholder="全支社" /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => <SelectItem key={b.id} value={b.id || '_none'}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">担当者</label>
                                <Select value={form.assigneeEmployeeId} onValueChange={set('assigneeEmployeeId')}>
                                    <SelectTrigger><SelectValue placeholder="未設定" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">未設定</SelectItem>
                                        {employees.map((e: any) => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.serviceName || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '登録する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
