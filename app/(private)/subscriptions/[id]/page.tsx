'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ExternalLink, User, Building2, History, Plus, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function AmountBig({ amount, currency }: { amount: number | null; currency: string }) {
    if (amount === null) return <span className="text-muted-foreground">金額未設定</span>;
    return (
        <span className="text-3xl font-bold tabular-nums">
            {currency === 'USD' ? `$${amount.toFixed(2)}` : `¥${amount.toLocaleString()}`}
            <span className="text-sm text-muted-foreground font-normal ml-1">/月</span>
        </span>
    );
}

function AddPriceDialog({ subscriptionId, onClose }: { subscriptionId: string; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ amount: '', currency: 'JPY', effectiveFrom: '', note: '' });
    const set = (key: string) => (v: string | null) => v && setForm((f) => ({ ...f, [key]: v }));

    const mutation = useMutation({
        mutationFn: async () => {
            await fetch(`/api/subscriptions/${subscriptionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
            qc.invalidateQueries({ queryKey: ['subscriptions'] });
            onClose();
        },
    });

    return (
        <Dialog open onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>金額変更を追加</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">金額 <span className="text-red-500">*</span></label>
                            <Input type="number" placeholder="2500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">通貨</label>
                            <Select value={form.currency} onValueChange={set('currency')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="JPY">JPY（円）</SelectItem>
                                    <SelectItem value="USD">USD（ドル）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">適用開始日 <span className="text-red-500">*</span></label>
                        <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">備考</label>
                        <Input placeholder="料金改定など" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={!form.amount || !form.effectiveFrom || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : '追加する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SubscriptionDetailPage() {
    const { id } = useParams() as { id: string };
    const [showAddPrice, setShowAddPrice] = useState(false);

    const { data: sub, isLoading } = useQuery<any>({
        queryKey: ['subscription', id],
        queryFn: async () => (await fetch(`/api/subscriptions/${id}`)).json(),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
    if (!sub) return <div className="p-8 text-center text-muted-foreground">サブスクが見つかりません。</div>;

    const latest = sub.priceHistory?.[0];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/subscriptions" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> サブスク一覧へ戻る
            </Link>

            {/* Hero */}
            <Card>
                <CardContent className="pt-6 flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {sub.serviceUrl ? (
                            <img src={`https://www.google.com/s2/favicons?sz=128&domain_url=${sub.serviceUrl}`} alt="" className="w-10 h-10" />
                        ) : <CreditCard className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold">{sub.serviceName}</h1>
                            {sub.serviceUrl && (
                                <a href={sub.serviceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand-500">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            <Badge variant="outline" className={latest?.currency === 'USD' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-violet-500 text-violet-600 dark:text-violet-400'}>
                                {latest?.currency ?? '—'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">{sub.corporateName}</p>
                        <AmountBig amount={latest?.amount ?? null} currency={latest?.currency ?? 'JPY'} />
                    </div>
                </CardContent>
            </Card>

            {/* Info grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
                    <CardContent className="space-y-0">
                        {[
                            { label: 'サービス名', value: sub.serviceName },
                            { label: '法人名', value: sub.corporateName },
                            {
                                label: '担当',
                                value: sub.assignee ? (
                                    <Link href={`/employees/${sub.assignee.id}`} className="text-brand-500 hover:underline flex items-center gap-1">
                                        <User className="w-3 h-3" /> {sub.assignee.name}
                                    </Link>
                                ) : '未設定',
                            },
                            {
                                label: '使用支社',
                                value: sub.branch ? (
                                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {sub.branch.name}</span>
                                ) : '全支社共通',
                            },
                        ].map((row) => (
                            <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                                <span className="text-sm text-muted-foreground">{row.label}</span>
                                <span className="text-sm font-medium">{row.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Latest price card */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-500" /> 現在の料金
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {latest ? (
                            <div className="space-y-3">
                                <div className="text-4xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
                                    {latest.currency === 'USD' ? `$${latest.amount.toFixed(2)}` : `¥${latest.amount.toLocaleString()}`}
                                    <span className="text-base text-muted-foreground font-normal ml-1">/月</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{new Date(latest.effectiveFrom).toLocaleDateString('ja-JP')} から適用</p>
                                {latest.note && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{latest.note}</p>}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-4">金額が未設定です</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Price history */}
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" /> 金額変更履歴
                        <Badge variant="secondary" className="ml-1">{sub.priceHistory?.length ?? 0}件</Badge>
                    </CardTitle>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddPrice(true)}>
                        <Plus className="w-3.5 h-3.5" /> 変更追加
                    </Button>
                </CardHeader>
                <CardContent>
                    {!sub.priceHistory?.length ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">変更履歴がありません</p>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />
                            <div className="space-y-4 pl-10">
                                {sub.priceHistory.map((h: any, i: number) => (
                                    <div key={h.id} className="relative">
                                        <div className={cn(
                                            'absolute -left-6 w-3 h-3 rounded-full border-2 border-background',
                                            i === 0 ? 'bg-brand-500' : 'bg-muted-foreground',
                                        )} />
                                        <div className="p-4 rounded-xl border border-border">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-base font-semibold tabular-nums">
                                                    {h.currency === 'USD' ? `$${h.amount.toFixed(2)}` : `¥${h.amount.toLocaleString()}`}
                                                    <span className="text-xs text-muted-foreground font-normal ml-1">/月</span>
                                                </span>
                                                {i === 0 && <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">現在</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{new Date(h.effectiveFrom).toLocaleDateString('ja-JP')} から適用</p>
                                            {h.note && <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">{h.note}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showAddPrice && <AddPriceDialog subscriptionId={id} onClose={() => setShowAddPrice(false)} />}
        </div>
    );
}
