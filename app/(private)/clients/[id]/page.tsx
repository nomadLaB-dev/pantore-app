'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Mail, Phone, MapPin, Handshake,
    FileSpreadsheet, FileText, ChevronRight, Calendar, RefreshCw, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DealBillingTypeLabel, DealStatusLabel } from '@/types';

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const invoiceStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    overdue: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const contractStatusColors: Record<string, string> = {
    signed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300',
};

export default function ClientDetailPage() {
    const { id } = useParams() as { id: string };

    const { data: client, isLoading } = useQuery<any>({
        queryKey: ['client', id],
        queryFn: async () => (await fetch(`/api/clients/${id}`)).json(),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">読み込み中…</div>;
    if (!client || client.error) return <div className="p-8 text-center text-muted-foreground">取引先が見つかりません。</div>;

    const totalBilledAmount = (client.invoices ?? []).reduce((s: number, i: any) => s + i.amount, 0);
    const pendingInvoices = (client.invoices ?? []).filter((i: any) => i.status === 'pending').length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 取引先一覧へ戻る
            </Link>

            {/* Client profile */}
            <Card>
                <CardContent className="pt-6 flex flex-col sm:flex-row items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-7 h-7 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold">{client.companyName}</h1>
                        {client.department && <p className="text-muted-foreground text-sm">{client.department}</p>}

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">担当者</p>
                                <p className="font-medium">{client.contactName}</p>
                            </div>
                            {client.contactEmail && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">メール</p>
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                        <a href={`mailto:${client.contactEmail}`} className="font-medium text-brand-600 dark:text-brand-400 hover:underline truncate">
                                            {client.contactEmail}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {client.contactPhone && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">電話</p>
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="font-medium">{client.contactPhone}</span>
                                    </div>
                                </div>
                            )}
                            {client.billingAddress && (
                                <div className="sm:col-span-3 mt-1">
                                    <p className="text-xs text-muted-foreground mb-0.5">請求先住所</p>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="font-medium">{client.billingAddress}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-3 sm:grid-cols-1 gap-3 shrink-0 w-full sm:w-36 text-center sm:text-right">
                        <div>
                            <p className="text-xs text-muted-foreground">取引件数</p>
                            <p className="text-2xl font-bold">{(client.deals ?? []).length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">累計請求額</p>
                            <p className="text-lg font-bold">¥{totalBilledAmount.toLocaleString()}</p>
                        </div>
                        {pendingInvoices > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground text-amber-600">未払い請求</p>
                                <p className="text-lg font-bold text-amber-600">{pendingInvoices} 件</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* ── 取引一覧 ──────────────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Handshake className="w-4 h-4 text-brand-500" /> 取引一覧
                    </h2>
                    {(client.deals ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm">取引がありません</p>
                    ) : (
                        (client.deals as any[]).map((d: any) => (
                            <Card key={d.id} className="hover:border-brand-400 transition-colors group">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColors[d.status])}>
                                                    {DealStatusLabel[d.status as keyof typeof DealStatusLabel]}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    {d.billingType === 'recurring' ? <RefreshCw className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                                    {DealBillingTypeLabel[d.billingType as keyof typeof DealBillingTypeLabel]}
                                                </span>
                                            </div>
                                            <p className="font-semibold truncate">{d.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ¥{d.amount.toLocaleString()}
                                                {d.billingType === 'recurring' ? ' /月' : ''}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(d.startDate).toLocaleDateString('ja-JP')} 〜 {d.endDate ? new Date(d.endDate).toLocaleDateString('ja-JP') : '継続'}
                                            </div>
                                        </div>
                                        <Link href={`/deals/${d.id}`}
                                            className="shrink-0 text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5 whitespace-nowrap mt-1">
                                            詳細 <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* ── 右カラム ──────────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 契約書 */}
                    <div>
                        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-brand-500" /> 契約書
                        </h2>
                        {(client.contracts ?? []).length === 0 ? (
                            <p className="text-muted-foreground text-sm">契約書がありません</p>
                        ) : (
                            <div className="space-y-2">
                                {(client.contracts as any[]).map((c: any) => (
                                    <div key={c.id} className="flex items-start justify-between gap-2 p-3 border border-border rounded-xl">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', contractStatusColors[c.status])}>
                                                    {c.status === 'signed' ? '署名済' : '下書き'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium leading-snug truncate">{c.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.generatedAt).toLocaleDateString('ja-JP')} 生成</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 請求一覧 */}
                    <div>
                        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                            <FileSpreadsheet className="w-4 h-4 text-brand-500" /> 請求履歴
                        </h2>
                        {(client.invoices ?? []).length === 0 ? (
                            <p className="text-muted-foreground text-sm">請求書がありません</p>
                        ) : (
                            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                                {(client.invoices as any[]).map((inv: any) => (
                                    <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium">{inv.number}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString('ja-JP')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold tabular-nums">¥{inv.amount.toLocaleString()}</p>
                                            <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', invoiceStatusColors[inv.status])}>
                                                {inv.status === 'paid' ? '支払済' : inv.status === 'pending' ? '未払い' : '延滞'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
