'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Plus, ExternalLink, User, Building2, ChevronRight, DollarSign, JapaneseYen } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewSubscriptionModal } from '@/components/modals/new-subscription-modal';
import { cn } from '@/lib/utils';

const USD_RATE = 150; // approximate JPY/USD for totaling

function AmountDisplay({ amount, currency, className }: { amount: number | null; currency: string; className?: string }) {
    if (amount === null) return <span className="text-muted-foreground text-sm">金額未設定</span>;
    return (
        <span className={cn('font-semibold tabular-nums', className)}>
            {currency === 'USD' ? (
                <><span className="text-xs mr-0.5">$</span>{amount.toFixed(2)}</>
            ) : (
                <><span className="text-xs mr-0.5">¥</span>{amount.toLocaleString()}</>
            )}
            <span className="text-xs text-muted-foreground font-normal ml-1">/月</span>
        </span>
    );
}

export default function SubscriptionsPage() {
    const [showNewModal, setShowNewModal] = useState(false);

    const { data: subscriptions = [], isLoading } = useQuery<any[]>({
        queryKey: ['subscriptions'],
        queryFn: async () => (await fetch('/api/subscriptions')).json(),
    });

    // Total monthly cost (approximate ¥)
    const totalJpy = subscriptions.reduce((sum, s) => {
        if (s.currentAmount === null) return sum;
        return sum + (s.currentCurrency === 'USD' ? s.currentAmount * USD_RATE : s.currentAmount);
    }, 0);

    const usdSubs = subscriptions.filter((s) => s.currentCurrency === 'USD').length;
    const jpySubs = subscriptions.filter((s) => s.currentCurrency === 'JPY').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">サブスク管理</h1>
                    <p className="text-muted-foreground text-sm">SaaSサービスの契約状況・費用・担当者を一元管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => setShowNewModal(true)}>
                    <Plus className="w-4 h-4" /> 新規登録
                </Button>
            </div>
            <NewSubscriptionModal open={showNewModal} onClose={() => setShowNewModal(false)} />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5 pb-4 flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-brand-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">サービス数</p>
                            <p className="text-2xl font-bold">{subscriptions.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4 flex items-center gap-3">
                        <JapaneseYen className="w-8 h-8 text-violet-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">円建て</p>
                            <p className="text-2xl font-bold">{jpySubs}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4 flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-green-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">ドル建て</p>
                            <p className="text-2xl font-bold">{usdSubs}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground">月額合計（概算¥）</p>
                        <p className="text-2xl font-bold">¥{Math.round(totalJpy).toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription cards */}
            {isLoading ? (
                <p className="text-center py-12 text-muted-foreground">読み込み中...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {subscriptions.map((s) => (
                        <Card key={s.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Service favicon */}
                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                            {s.serviceUrl ? (
                                                <img
                                                    src={`https://www.google.com/s2/favicons?sz=64&domain_url=${s.serviceUrl}`}
                                                    alt=""
                                                    className="w-6 h-6"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : <CreditCard className="w-5 h-5 text-muted-foreground" />}
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {s.serviceName}
                                                {s.serviceUrl && (
                                                    <a href={s.serviceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand-500">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground truncate">{s.corporateName}</p>
                                        </div>
                                    </div>
                                    <AmountDisplay amount={s.currentAmount} currency={s.currentCurrency} className="text-base shrink-0" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{s.branch?.name ?? '全支社'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <User className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{s.assignee?.name ?? '未設定'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <Badge variant="outline" className={s.currentCurrency === 'USD' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-violet-500 text-violet-600 dark:text-violet-400'}>
                                        {s.currentCurrency}
                                    </Badge>
                                    <Link href={`/subscriptions/${s.id}`}>
                                        <Button variant="ghost" size="sm" className="gap-1 text-brand-500 h-8">
                                            詳細 <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
