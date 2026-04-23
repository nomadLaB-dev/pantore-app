'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Handshake, FileText, FileSpreadsheet, Users,
    Calendar, RefreshCw, Zap, CheckCircle2, Clock, Download,
    FilePlus2, Pencil, UserCheck, ChevronRight, AlertCircle,
    StickyNote, History, FileSignature,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DealBillingTypeLabel, DealStatusLabel } from '@/types';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300',
    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const invoiceStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    overdue: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const contractStatusConfig: Record<string, { label: string; color: string }> = {
    signed: { label: '署名済', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    draft: { label: '下書き', color: 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300' },
};

const TABS = [
    { id: 'overview', label: '概要', icon: Handshake },
    { id: 'minutes', label: 'メモ・議事録', icon: StickyNote },
    { id: 'contracts', label: '契約書', icon: FileSignature },
    { id: 'invoices', label: '請求書', icon: FileSpreadsheet },
    { id: 'assignees', label: '担当者履歴', icon: History },
] as const;
type TabId = typeof TABS[number]['id'];

// ──────── Sub-components ─────────────────────────────────────────────────────

function MinutesTab({ deal }: { deal: any }) {
    const [body, setBody] = useState('');
    const [title, setTitle] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');

    const downloadTxt = (minute: any) => {
        const blob = new Blob([`${minute.title}\n\n${minute.body}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${minute.title}.txt`; a.click();
        URL.revokeObjectURL(url);
    };

    const minutes: any[] = deal.minutes ?? [];

    return (
        <div className="space-y-5">
            {/* Add new note */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><StickyNote className="w-4 h-4 text-brand-500" /> 新しいメモ・議事録</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                    <Input
                        placeholder="タイトル（例: 2026-04-13 月次レビュー）"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        className="w-full h-32 rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        placeholder="議事内容・メモを入力…"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={!title.trim() || !body.trim()}
                            onClick={() => { toast.success('議事録を保存しました', { description: 'UIデモ動作です' }); setTitle(''); setBody(''); }}
                        >
                            保存
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Existing minutes */}
            {minutes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">議事録がありません</p>
            ) : (
                <div className="space-y-3">
                    {minutes.map((m: any) => (
                        <Card key={m.id}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm">{m.title}</p>
                                        <p className="text-xs text-muted-foreground mb-2">{new Date(m.createdAt).toLocaleDateString('ja-JP')}</p>
                                        {editId === m.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    className="w-full h-28 rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                                    value={editBody}
                                                    onChange={(e) => setEditBody(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white" onClick={() => { setEditId(null); toast.success('更新しました', { description: 'UIデモ動作です' }); }}>保存</Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>キャンセル</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <pre className="text-sm whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed">{m.body}</pre>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => { setEditId(m.id); setEditBody(m.body); }}>
                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => downloadTxt(m)}>
                                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function ContractsTab({ deal }: { deal: any }) {
    const [genModal, setGenModal] = useState(false);
    const [genForm, setGenForm] = useState({ title: `業務委託契約書（${deal.name}）`, notes: '' });

    const contracts: any[] = deal.contracts ?? [];

    return (
        <div className="space-y-5">
            {/* Generate button */}
            <div className="flex justify-end">
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => setGenModal(true)}>
                    <FilePlus2 className="w-4 h-4" /> 契約書を生成
                </Button>
            </div>

            {/* Existing contracts */}
            {contracts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">契約書がありません</p>
            ) : (
                <div className="space-y-3">
                    {contracts.map((c: any) => {
                        const cfg = contractStatusConfig[c.status];
                        return (
                            <Card key={c.id}>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>{cfg.label}</span>
                                            </div>
                                            <p className="font-semibold text-sm">{c.title}</p>
                                            <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                                                <p>生成: {new Date(c.generatedAt).toLocaleDateString('ja-JP')}</p>
                                                {c.signedAt && <p>署名: {new Date(c.signedAt).toLocaleDateString('ja-JP')}</p>}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => toast.info('PDF ダウンロード', { description: 'UIデモ動作です' })}>
                                            <Download className="w-3.5 h-3.5" /> PDF
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Generate modal */}
            <Dialog open={genModal} onOpenChange={(v) => !v && setGenModal(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>契約書を生成</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">タイトル</label>
                            <Input value={genForm.title} onChange={(e) => setGenForm({ ...genForm, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">特記事項・備考</label>
                            <textarea
                                className="w-full h-24 rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                placeholder="追加の特記事項…"
                                value={genForm.notes}
                                onChange={(e) => setGenForm({ ...genForm, notes: e.target.value })}
                            />
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                            <p className="font-semibold mb-1">生成される内容（プレビュー）</p>
                            <ul className="text-xs space-y-0.5 opacity-80 list-disc list-inside">
                                <li>業務委託契約書（{deal.client?.companyName} 宛）</li>
                                <li>案件名: {deal.name}</li>
                                <li>契約期間: {new Date(deal.startDate).toLocaleDateString('ja-JP')} 〜 {deal.endDate ? new Date(deal.endDate).toLocaleDateString('ja-JP') : '終期未定'}</li>
                                <li>報酬: ¥{deal.amount.toLocaleString()}{deal.billingType === 'recurring' ? '/月' : '（一括）'}</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenModal(false)}>キャンセル</Button>
                        <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => { setGenModal(false); toast.success('契約書を生成しました', { description: 'UIデモ動作です' }); }}>
                            <FilePlus2 className="w-4 h-4" /> 生成する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InvoicesTab({ deal }: { deal: any }) {
    const invoices: any[] = deal.invoices ?? [];
    const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s: number, i: any) => s + i.amount, 0);
    const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s: number, i: any) => s + i.amount, 0);

    return (
        <div className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4">
                <Card><CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">支払済合計</p>
                    <p className="text-xl font-bold text-green-600">¥{totalPaid.toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">未払い合計</p>
                    <p className="text-xl font-bold text-amber-600">¥{totalPending.toLocaleString()}</p>
                </CardContent></Card>
            </div>

            <div className="flex justify-end">
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => toast.info('請求書発行', { description: 'UIデモ動作です' })}>
                    <FileSpreadsheet className="w-4 h-4" /> 請求書を発行
                </Button>
            </div>

            {invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">請求書がありません</p>
            ) : (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                    {invoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                            <div>
                                <p className="text-sm font-semibold">{inv.number}</p>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                    <span>発行: {new Date(inv.issuedAt).toLocaleDateString('ja-JP')}</span>
                                    <span>期限: {new Date(inv.dueDate).toLocaleDateString('ja-JP')}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold tabular-nums">¥{inv.amount.toLocaleString()}</p>
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', invoiceStatusColors[inv.status])}>
                                    {inv.status === 'paid' ? '支払済' : inv.status === 'pending' ? '未払い' : '延滞'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AssigneesTab({ deal }: { deal: any }) {
    const [handoverModal, setHandoverModal] = useState(false);
    const [handoverForm, setHandoverForm] = useState({ assigneeName: '', assigneeEmail: '', handoverNote: '' });
    const history: any[] = deal.assigneeHistory ?? [];

    return (
        <div className="space-y-5">
            <div className="flex justify-end">
                <Button
                    className="bg-brand-500 hover:bg-brand-600 text-white gap-2"
                    onClick={() => setHandoverModal(true)}
                >
                    <UserCheck className="w-4 h-4" /> 引き継ぎを記録
                </Button>
            </div>

            {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">担当者の記録がありません</p>
            ) : (
                <div className="relative">
                    <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />
                    <div className="space-y-4 pl-10">
                        {history.map((a: any, i: number) => (
                            <div key={a.id} className="relative">
                                <div className={cn(
                                    'absolute -left-6 w-3 h-3 rounded-full border-2 border-background',
                                    i === 0 ? 'bg-brand-500' : 'bg-muted-foreground',
                                )} />
                                <div className="p-4 border border-border rounded-xl">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold text-xs">
                                            {a.assigneeName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{a.assigneeName}</p>
                                            {a.assigneeEmail && <p className="text-xs text-muted-foreground">{a.assigneeEmail}</p>}
                                        </div>
                                        {i === 0 && <span className="ml-auto text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">現在</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(a.assignedAt).toLocaleDateString('ja-JP')} から担当
                                    </div>
                                    {a.handoverNote && (
                                        <div className="mt-2 pt-2 border-t border-border">
                                            <p className="text-xs text-muted-foreground font-medium mb-0.5">引き継ぎメモ</p>
                                            <p className="text-sm text-foreground/80">{a.handoverNote}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={handoverModal} onOpenChange={(v) => !v && setHandoverModal(false)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>引き継ぎを記録</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">新担当者氏名 <span className="text-red-500">*</span></label>
                            <Input placeholder="佐藤 花子" value={handoverForm.assigneeName} onChange={(e) => setHandoverForm({ ...handoverForm, assigneeName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">メールアドレス</label>
                            <Input type="email" placeholder="sato@pantore.test" value={handoverForm.assigneeEmail} onChange={(e) => setHandoverForm({ ...handoverForm, assigneeEmail: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">引き継ぎメモ</label>
                            <textarea
                                className="w-full h-20 rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                placeholder="引き継ぎ時の注意点・経緯など"
                                value={handoverForm.handoverNote}
                                onChange={(e) => setHandoverForm({ ...handoverForm, handoverNote: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHandoverModal(false)}>キャンセル</Button>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={!handoverForm.assigneeName.trim()}
                            onClick={() => { setHandoverModal(false); toast.success('引き継ぎを記録しました', { description: 'UIデモ動作です' }); }}
                        >
                            記録する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ──────── Main page ──────────────────────────────────────────────────────────

export default function DealDetailPage() {
    const { id } = useParams() as { id: string };
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const { data: deal, isLoading } = useQuery<any>({
        queryKey: ['deal', id],
        queryFn: async () => (await fetch(`/api/deals/${id}`)).json(),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">読み込み中…</div>;
    if (!deal || deal.error) return <div className="p-8 text-center text-muted-foreground">取引が見つかりません。</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/deals" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 取引一覧へ戻る
            </Link>

            {/* Header card */}
            <Card>
                <CardContent className="pt-6 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={cn('text-sm px-2.5 py-0.5 rounded-full font-medium', statusColors[deal.status])}>
                                    {DealStatusLabel[deal.status as keyof typeof DealStatusLabel]}
                                </span>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    {deal.billingType === 'recurring' ? <RefreshCw className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                    {DealBillingTypeLabel[deal.billingType as keyof typeof DealBillingTypeLabel]}
                                </span>
                                {deal.autoRenew && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">自動更新</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold">{deal.name}</h1>
                            {deal.client && (
                                <Link href={`/clients/${deal.client.id}`} className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline mt-1">
                                    {deal.client.companyName} {deal.client.department ? `· ${deal.client.department}` : ''}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 mt-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">期間</p>
                                    <div className="flex items-center gap-1 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>{new Date(deal.startDate).toLocaleDateString('ja-JP')} 〜 {deal.endDate ? new Date(deal.endDate).toLocaleDateString('ja-JP') : '継続'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">金額</p>
                                    <p className="font-bold text-base">¥{deal.amount.toLocaleString()}{deal.billingType === 'recurring' ? '/月' : ''}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">現在の担当</p>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                        {deal.currentAssignee?.assigneeName ?? '—'}
                                    </div>
                                </div>
                                {deal.notes && (
                                    <div className="sm:col-span-2">
                                        <p className="text-xs text-muted-foreground mb-0.5">メモ</p>
                                        <p className="text-sm text-foreground/70">{deal.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
                <div className="flex overflow-x-auto border-b border-border">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap outline-none',
                                activeTab === tab.id
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                            )}
                        >
                            <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-brand-500' : 'text-muted-foreground')} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <CardContent className="pt-6">
                    {/* Overview */}
                    {activeTab === 'overview' && (
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Card><CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground">契約書</p>
                                <p className="text-2xl font-bold">{(deal.contracts ?? []).length} 件</p>
                            </CardContent></Card>
                            <Card><CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground">請求済合計</p>
                                <p className="text-2xl font-bold">¥{(deal.invoices ?? []).reduce((s: number, i: any) => s + i.amount, 0).toLocaleString()}</p>
                            </CardContent></Card>
                            <Card><CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground">議事録</p>
                                <p className="text-2xl font-bold">{(deal.minutes ?? []).length} 件</p>
                            </CardContent></Card>
                        </div>
                    )}

                    {activeTab === 'minutes' && <MinutesTab deal={deal} />}
                    {activeTab === 'contracts' && <ContractsTab deal={deal} />}
                    {activeTab === 'invoices' && <InvoicesTab deal={deal} />}
                    {activeTab === 'assignees' && <AssigneesTab deal={deal} />}
                </CardContent>
            </Card>
        </div>
    );
}
