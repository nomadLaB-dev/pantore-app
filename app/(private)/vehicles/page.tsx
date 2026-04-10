'use client';
import { useQuery } from '@tanstack/react-query';
import { Car, Plus, AlertTriangle, Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const severityMap = {
    low: { label: '軽微', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
    medium: { label: '中程度', class: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' },
    high: { label: '重大', class: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
};

export default function VehiclesPage() {
    const { data: vehicles = [], isLoading } = useQuery<any[]>({
        queryKey: ['vehicles'],
        queryFn: async () => (await fetch('/api/vehicles')).json(),
    });

    const totalAccidents = vehicles.reduce((s, v) => s + v.accidents.length, 0);
    const leased = vehicles.filter((v) => v.ownershipType === 'leased').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">車両管理</h1>
                    <p className="text-muted-foreground text-sm">支社別の車両・リース・事故情報を管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2">
                    <Plus className="w-4 h-4" /> 新規登録
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '管理台数', value: vehicles.length, icon: Car, color: 'text-blue-500' },
                    { label: 'リース台数', value: leased, icon: Car, color: 'text-brand-500' },
                    { label: '自社保有', value: vehicles.length - leased, icon: Car, color: 'text-violet-500' },
                    { label: '事故件数(累計)', value: totalAccidents, icon: AlertTriangle, color: 'text-red-500' },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="pt-5 pb-4 flex items-center gap-3">
                            <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
                            <div>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-2xl font-bold">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Vehicle cards */}
            {isLoading ? (
                <p className="text-muted-foreground text-sm text-center py-12">読み込み中...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {vehicles.map((v) => (
                        <Card key={v.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base">{v.manufacturer} {v.model}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{v.licensePlate}</p>
                                    </div>
                                    <Badge variant={v.ownershipType === 'leased' ? 'secondary' : 'outline'}>
                                        {v.ownershipType === 'leased' ? 'リース' : '自社保有'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Branch */}
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">配属支社:</span>
                                    <span className="font-medium">{v.branch?.name ?? '未設定'}</span>
                                </div>

                                {/* Lease info */}
                                {v.lease && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                                        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">リース情報</p>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{v.lease.leaseCompany}</span>
                                            <span className="font-medium">¥{v.lease.monthlyFee.toLocaleString()}/月</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{new Date(v.lease.contractStartDate).toLocaleDateString('ja-JP')}</span>
                                            <span>〜 {new Date(v.lease.contractEndDate).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Accidents */}
                                {v.accidents.length > 0 && (
                                    <div className="space-y-1.5">
                                        {v.accidents.map((acc: any) => (
                                            <div key={acc.id} className="flex items-center gap-2 text-xs p-2 rounded-lg border border-border">
                                                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />
                                                <span className="flex-1 text-muted-foreground">{acc.description}</span>
                                                <span className={`px-1.5 py-0.5 rounded font-medium text-xs ${severityMap[acc.severity as keyof typeof severityMap].class}`}>
                                                    {severityMap[acc.severity as keyof typeof severityMap].label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end pt-1">
                                    <Link href={`/vehicles/${v.id}`}>
                                        <Button variant="ghost" size="sm" className="gap-1 text-brand-500 hover:text-brand-600">
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
