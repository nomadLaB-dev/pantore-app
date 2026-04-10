'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Building2, AlertTriangle, CalendarDays, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const severityMap = {
    low: { label: '軽微', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
    medium: { label: '中程度', class: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' },
    high: { label: '重大', class: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

export default function VehicleDetailPage() {
    const { id } = useParams() as { id: string };

    const { data: vehicle, isLoading } = useQuery<any>({
        queryKey: ['vehicle', id],
        queryFn: async () => (await fetch(`/api/vehicles/${id}`)).json(),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
    if (!vehicle) return <div className="p-8 text-center text-muted-foreground">車両が見つかりません。</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/vehicles" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 車両一覧へ戻る
            </Link>

            {/* Hero */}
            <Card>
                <CardContent className="pt-6 flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                        <Car className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold">{vehicle.manufacturer} {vehicle.model}</h1>
                            <Badge variant={vehicle.ownershipType === 'leased' ? 'secondary' : 'outline'}>
                                {vehicle.ownershipType === 'leased' ? 'リース' : '自社保有'}
                            </Badge>
                        </div>
                        <p className="font-mono text-muted-foreground">{vehicle.licensePlate}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Basic info */}
                <Card>
                    <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
                    <CardContent>
                        <InfoRow label="メーカー" value={vehicle.manufacturer} />
                        <InfoRow label="モデル" value={vehicle.model} />
                        <InfoRow label="ナンバー" value={<span className="font-mono">{vehicle.licensePlate}</span>} />
                        <InfoRow label="保有形態" value={vehicle.ownershipType === 'leased' ? 'リース' : '自社保有'} />
                        <InfoRow
                            label="配属支社"
                            value={
                                vehicle.branch ? (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {vehicle.branch.name}
                                    </span>
                                ) : '未設定'}
                        />
                    </CardContent>
                </Card>

                {/* Lease info */}
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="w-4 h-4" />リース情報</CardTitle></CardHeader>
                    <CardContent>
                        {vehicle.lease ? (
                            <>
                                <InfoRow label="リース会社" value={vehicle.lease.leaseCompany} />
                                <InfoRow label="月額" value={`¥${vehicle.lease.monthlyFee.toLocaleString()}`} />
                                <InfoRow label="開始日" value={new Date(vehicle.lease.contractStartDate).toLocaleDateString('ja-JP')} />
                                <InfoRow label="終了日" value={new Date(vehicle.lease.contractEndDate).toLocaleDateString('ja-JP')} />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">リース契約なし</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Accident history */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        事故履歴
                        <Badge variant="secondary" className="ml-auto">{vehicle.accidents.length}件</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {vehicle.accidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">事故の記録はありません</p>
                    ) : (
                        <div className="space-y-3">
                            {vehicle.accidents.map((acc: any) => (
                                <div key={acc.id} className="p-4 rounded-xl border border-border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(acc.accidentDate).toLocaleDateString('ja-JP')}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityMap[acc.severity as keyof typeof severityMap].class}`}>
                                            {severityMap[acc.severity as keyof typeof severityMap].label}
                                        </span>
                                    </div>
                                    <p className="text-sm">{acc.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
