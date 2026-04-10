'use client';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Car, Building2, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function DaysLeftBadge({ days }: { days: number }) {
    if (days <= 30) {
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">残り{days}日</span>;
    }
    if (days <= 90) {
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">残り{days}日</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">残り{days}日</span>;
}

export default function ContractsPage() {
    const { data: contracts = [], isLoading } = useQuery<any[]>({
        queryKey: ['contracts'],
        queryFn: async () => (await fetch('/api/contracts')).json(),
    });

    const expiringSoon = contracts.filter((c) => c.daysLeft <= 90);
    const totalMonthly = contracts.reduce((s, c) => s + (c.monthlyFee || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">契約管理</h1>
                    <p className="text-muted-foreground text-sm">車両・不動産に紐付く全契約を期限順に管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2 hidden">
                    新規追加
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-5 pb-4 flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-brand-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">管理契約数</p>
                            <p className="text-2xl font-bold">{contracts.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4 flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">期限90日以内</p>
                            <p className="text-2xl font-bold">{expiringSoon.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                    <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground">月額合計（概算）</p>
                        <p className="text-2xl font-bold">¥{totalMonthly.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert banner */}
            {expiringSoon.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold text-amber-800 dark:text-amber-300">期限アラート</p>
                        <p className="text-amber-700 dark:text-amber-400">{expiringSoon.length}件の契約が90日以内に期限を迎えます。早急にご確認ください。</p>
                    </div>
                </div>
            )}

            {/* Contracts Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">契約一覧（期限順）</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <p className="text-center py-12 text-muted-foreground">読み込み中...</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {contracts.map((c) => (
                                <div
                                    key={c.id}
                                    className={cn(
                                        'flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 hover:bg-muted/50 transition-colors',
                                        c.daysLeft <= 30 && 'border-l-4 border-l-red-500'
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                            c.relatedType === 'vehicle' ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-violet-100 dark:bg-violet-500/20'
                                        )}>
                                            {c.relatedType === 'vehicle'
                                                ? <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                : <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{c.relatedName}</p>
                                            <p className="text-xs text-muted-foreground">{c.counterparty}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:shrink-0">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{new Date(c.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(c.endDate).toLocaleDateString('ja-JP')}</p>
                                            <p className="text-sm font-medium">¥{c.monthlyFee.toLocaleString()}/月</p>
                                        </div>
                                        <DaysLeftBadge days={c.daysLeft} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
