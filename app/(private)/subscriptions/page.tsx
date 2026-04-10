'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    CreditCard, Plus, ExternalLink, User, Building2, ChevronRight,
    DollarSign, JapaneseYen, BarChart3, RefreshCcw, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NewSubscriptionModal } from '@/components/modals/new-subscription-modal';
import { SubscriptionBillingIntervalLabel } from '@/types';
import { cn } from '@/lib/utils';

const USD_RATE = 150;

type BillingInterval = 'monthly' | 'annual' | 'usage' | 'one_time';

const intervalConfig: Record<BillingInterval, { icon: React.ElementType; colorClass: string; badgeClass: string }> = {
    monthly: { icon: RefreshCcw, colorClass: 'text-brand-500', badgeClass: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 border-brand-200 dark:border-brand-500/30' },
    annual: { icon: Calendar, colorClass: 'text-violet-500', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 border-violet-200 dark:border-violet-500/30' },
    usage: { icon: BarChart3, colorClass: 'text-orange-500', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' },
    one_time: { icon: CreditCard, colorClass: 'text-slate-500', badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600' },
};

function formatAmount(amount: number | null, currency: string, interval: string) {
    if (amount === null) return <span className="text-muted-foreground text-sm">—</span>;
    if (interval === 'usage') return <span className="text-sm text-orange-600 dark:text-orange-400">従量</span>;
    const fmt = currency === 'USD' ? `$${amount.toFixed(2)}` : `¥${amount.toLocaleString()}`;
    return <span className="font-mono font-semibold tabular-nums">{fmt}</span>;
}

export default function SubscriptionsPage() {
    const [showNewModal, setShowNewModal] = useState(false);

    const { data: subscriptions = [], isLoading } = useQuery<any[]>({
        queryKey: ['subscriptions'],
        queryFn: async () => (await fetch('/api/subscriptions')).json(),
    });

    const totalJpy = subscriptions.reduce((sum, s) => {
        if (s.currentAmount === null || s.billingInterval === 'usage') return sum;
        const monthly = s.billingInterval === 'annual' ? s.currentAmount / 12 : s.currentAmount;
        return sum + (s.currentCurrency === 'USD' ? monthly * USD_RATE : monthly);
    }, 0);

    const byInterval = (interval: string) => subscriptions.filter((s) => s.billingInterval === interval).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">サブスク管理</h1>
                    <p className="text-muted-foreground text-sm">SaaSサービスの契約・費用・担当者を一元管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => setShowNewModal(true)}>
                    <Plus className="w-4 h-4" /> 新規登録
                </Button>
            </div>
            <NewSubscriptionModal open={showNewModal} onClose={() => setShowNewModal(false)} />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">サービス数</p>
                    <p className="text-2xl font-bold">{subscriptions.length}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">月額換算合計（概算）</p>
                    <p className="text-2xl font-bold">¥{Math.round(totalJpy).toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-5 pb-4">
                    <div className="flex gap-3 text-sm">
                        <span><RefreshCcw className="w-3 h-3 inline mr-1 text-brand-500" />月額 {byInterval('monthly')}</span>
                        <span><Calendar className="w-3 h-3 inline mr-1 text-violet-500" />年額 {byInterval('annual')}</span>
                    </div>
                    <div className="flex gap-3 text-sm mt-1">
                        <span><BarChart3 className="w-3 h-3 inline mr-1 text-orange-500" />従量 {byInterval('usage')}</span>
                    </div>
                </CardContent></Card>
                <Card><CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">通貨内訳</p>
                    <div className="flex gap-3 text-sm">
                        <span><JapaneseYen className="w-3 h-3 inline mr-0.5 text-violet-500" />円 {subscriptions.filter(s => s.currentCurrency === 'JPY').length}</span>
                        <span><DollarSign className="w-3 h-3 inline mr-0 text-green-500" />ドル {subscriptions.filter(s => s.currentCurrency === 'USD').length}</span>
                    </div>
                </CardContent></Card>
            </div>

            {/* List table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                                <th className="text-left px-4 py-3 font-medium">サービス</th>
                                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">課金形態</th>
                                <th className="text-right px-4 py-3 font-medium">金額</th>
                                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">使用支社</th>
                                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">担当</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-muted-foreground">読み込み中...</td>
                                </tr>
                            )}
                            {subscriptions.map((s, i) => {
                                const cfg = intervalConfig[s.billingInterval as BillingInterval] ?? intervalConfig.monthly;
                                return (
                                    <tr
                                        key={s.id}
                                        className={cn(
                                            'border-b border-border last:border-0 transition-colors hover:bg-muted/40',
                                            i % 2 === 0 ? '' : 'bg-muted/10',
                                        )}
                                    >
                                        {/* Service name + logo */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                                    {s.serviceUrl ? (
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?sz=64&domain_url=${s.serviceUrl}`}
                                                            alt=""
                                                            className="w-5 h-5"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    ) : <CreditCard className="w-4 h-4 text-muted-foreground" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium flex items-center gap-1.5 truncate">
                                                        {s.serviceName}
                                                        {s.serviceUrl && (
                                                            <a href={s.serviceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand-500 shrink-0">
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">{s.corporateName}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Billing interval badge */}
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', cfg.badgeClass)}>
                                                <cfg.icon className="w-3 h-3" />
                                                {SubscriptionBillingIntervalLabel[s.billingInterval as BillingInterval]}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {formatAmount(s.currentAmount, s.currentCurrency, s.billingInterval)}
                                            <span className={cn(
                                                'ml-1 text-[10px] font-normal',
                                                s.billingInterval === 'usage' ? 'hidden' : 'text-muted-foreground',
                                            )}>
                                                {s.billingInterval === 'annual' ? '/年' : s.billingInterval === 'monthly' ? '/月' : ''}
                                            </span>
                                            <span className="ml-1 text-[10px] text-muted-foreground hidden md:inline">
                                                {s.currentCurrency}
                                            </span>
                                        </td>

                                        {/* Branch */}
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Building2 className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{s.branch?.name ?? '全支社'}</span>
                                            </span>
                                        </td>

                                        {/* Assignee */}
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <User className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{s.assignee?.name ?? '未設定'}</span>
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/subscriptions/${s.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-brand-500 px-2">
                                                    詳細 <ChevronRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
