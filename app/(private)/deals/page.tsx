'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    Handshake, Plus, Search, FileText, RefreshCw, Zap, Calendar,
    ChevronRight, CheckCircle2, XCircle, FileSpreadsheet, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DealBillingTypeLabel, DealStatusLabel } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const billingColors: Record<string, string> = {
    shot: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    recurring: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const emptyDeal = {
    clientId: '',
    name: '',
    startDate: '',
    endDate: '',
    autoRenew: false,
    billingType: 'shot' as 'shot' | 'recurring',
    amount: '',
    notes: '',
};

const REQUIRED_DEAL = ['clientId', 'name', 'startDate', 'billingType', 'amount'] as const;

function NewDealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState(emptyDeal);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const { data: clients = [] } = useQuery<any[]>({ queryKey: ['clients'], queryFn: async () => (await fetch('/api/clients')).json() });

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleClose = () => { setForm(emptyDeal); setErrors([]); onClose(); };

    const handleSave = async () => {
        const missing = REQUIRED_DEAL.filter((f) => !String((form as any)[f]).trim());
        if (missing.length) { setErrors(missing); return; }
        setSaving(true);
        await fetch('/api/deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, amount: Number(form.amount) }),
        });
        await qc.invalidateQueries({ queryKey: ['deals'] });
        setSaving(false);
        handleClose();
    };

    const isRecurring = form.billingType === 'recurring';

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>取引を追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">

                    {/* Client */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">取引先 <span className="text-red-500">*</span></label>
                        <Select value={form.clientId} onValueChange={(v) => v && setForm((f) => ({ ...f, clientId: v }))}>
                            <SelectTrigger className={cn(errors.includes('clientId') && 'border-red-400')}>
                                <SelectValue placeholder="取引先を選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>{c.companyName} {c.department ? `(${c.department})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Deal name */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">案件名 <span className="text-red-500">*</span></label>
                        <Input placeholder="食品管理システム 導入支援" value={form.name} onChange={set('name')}
                            className={cn(errors.includes('name') && 'border-red-400')} />
                    </div>

                    {/* Period */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">期間</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">開始日 <span className="text-red-500">*</span></label>
                                <Input type="date" value={form.startDate} onChange={set('startDate')}
                                    className={cn(errors.includes('startDate') && 'border-red-400')} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">終了日</label>
                                <Input type="date" value={form.endDate} onChange={set('endDate')} />
                            </div>
                        </div>
                        {isRecurring && (
                            <label className="flex items-center gap-2.5 cursor-pointer select-none mt-3">
                                <div
                                    onClick={() => setForm((f) => ({ ...f, autoRenew: !f.autoRenew }))}
                                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.autoRenew ? 'bg-brand-500' : 'bg-muted-foreground/30'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.autoRenew ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm">自動更新あり</span>
                            </label>
                        )}
                    </div>

                    {/* Billing */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">請求</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">請求タイプ <span className="text-red-500">*</span></label>
                                <Select value={form.billingType} onValueChange={(v) => v && setForm((f) => ({ ...f, billingType: v as any, autoRenew: false }))}>
                                    <SelectTrigger className={cn(errors.includes('billingType') && 'border-red-400')}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(DealBillingTypeLabel).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    {isRecurring ? '月額' : '合計金額'} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                                    <Input type="number" placeholder="120000" className={cn('pl-7', errors.includes('amount') && 'border-red-400')}
                                        value={form.amount} onChange={set('amount')} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">備考</label>
                        <Input placeholder="月次定例MTG、SLA 99.5%など" value={form.notes} onChange={set('notes')} />
                    </div>

                    {errors.length > 0 && (
                        <div className="flex items-center gap-1.5 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" /> 必須項目を入力してください
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={handleClose}>キャンセル</Button>
                    <Button className="bg-brand-500 hover:bg-brand-600 text-white" disabled={saving} onClick={handleSave}>
                        {saving ? '保存中…' : '取引を作成'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function DealsPage() {
    const [newModal, setNewModal] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: deals = [], isLoading } = useQuery<any[]>({
        queryKey: ['deals'],
        queryFn: async () => (await fetch('/api/deals')).json(),
    });

    const filtered = deals.filter((d) => {
        const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.client?.companyName?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalActive = deals.filter((d) => d.status === 'active').length;
    const totalAmount = deals.reduce((s: number, d: any) => s + (d.status === 'active' ? d.amount : 0), 0);

    // Fake invoice handler
    const handleInvoice = (deal: any, e: React.MouseEvent) => {
        e.stopPropagation();
        alert(`請求書発行: ${deal.name}\n（機能実装予定）`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">取引管理</h1>
                    <p className="text-muted-foreground text-sm">
                        進行中 {totalActive} 件 · 月次合計 ¥{totalAmount.toLocaleString()}
                    </p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2 self-start sm:self-auto" onClick={() => setNewModal(true)}>
                    <Plus className="w-4 h-4" /> 取引を追加
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="案件名・取引先で検索…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        {Object.entries(DealStatusLabel).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            {isLoading ? (
                <p className="text-muted-foreground text-center py-12">読み込み中…</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Handshake className="w-12 h-12 mb-4 opacity-30" />
                    <p>取引がありません</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((d: any) => (
                        <Card key={d.id} className="hover:border-brand-400 transition-colors group">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColors[d.status])}>
                                                {DealStatusLabel[d.status as keyof typeof DealStatusLabel]}
                                            </span>
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', billingColors[d.billingType])}>
                                                {d.billingType === 'recurring'
                                                    ? <><RefreshCw className="w-3 h-3" /> {DealBillingTypeLabel.recurring}</>
                                                    : <><Zap className="w-3 h-3" /> {DealBillingTypeLabel.shot}</>}
                                            </span>
                                            {d.autoRenew && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                                                    自動更新
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-semibold text-base truncate">{d.name}</p>
                                        {d.client && (
                                            <p className="text-sm text-muted-foreground truncate">{d.client.companyName}{d.client.department ? ` · ${d.client.department}` : ''}</p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(d.startDate).toLocaleDateString('ja-JP')} 〜 {d.endDate ? new Date(d.endDate).toLocaleDateString('ja-JP') : '継続'}</span>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                                        <p className="text-xl font-bold tabular-nums">
                                            ¥{d.amount.toLocaleString()}
                                            {d.billingType === 'recurring' && <span className="text-sm font-normal text-muted-foreground"> /月</span>}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 text-xs hover:border-brand-500 hover:text-brand-600"
                                            onClick={(e) => handleInvoice(d, e)}
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                            請求書発行
                                        </Button>
                                    </div>
                                </div>
                                {d.notes && (
                                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{d.notes}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <NewDealModal open={newModal} onClose={() => setNewModal(false)} />
        </div>
    );
}
