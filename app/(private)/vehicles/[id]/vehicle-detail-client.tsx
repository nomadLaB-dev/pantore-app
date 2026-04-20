'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Car, Building2, AlertTriangle, CalendarDays, Receipt,
    TrendingDown, Calculator, Info, ShieldCheck, Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    calcDepreciationSchedule, calcUsedCarUsefulLife, getUsefulLife,
    VehicleBodyTypeLabel, DepreciationMethodLabel,
    type VehicleBodyType, type DepreciationMethod, type DepreciationScheduleRow,
} from '@/lib/depreciation';
import { InsuranceTypeLabel } from '@/types';
import { InsuranceModal } from '@/components/modals/insurance-modal';
import { cn } from '@/lib/utils';

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

function DepreciationPanel({ vehicle }: { vehicle: any }) {
    const dep = vehicle.depreciation;

    const [acquisitionCost, setAcquisitionCost] = useState<string>(String(dep?.acquisitionCost ?? ''));
    const [bodyType, setBodyType] = useState<VehicleBodyType>(dep?.bodyType ?? 'passenger_standard');
    const [isNewCar, setIsNewCar] = useState<boolean>(dep?.isNewCar ?? true);
    const [purchaseYear, setPurchaseYear] = useState<string>(
        dep?.purchaseDate ? String(new Date(dep.purchaseDate).getFullYear()) : String(new Date().getFullYear()),
    );
    const [firstRegYear, setFirstRegYear] = useState<string>(
        dep?.firstRegistrationDate ? String(new Date(dep.firstRegistrationDate).getFullYear()) : '',
    );
    const [method, setMethod] = useState<DepreciationMethod>('straight');

    const cost = Number(acquisitionCost);
    const pYear = Number(purchaseYear);
    const fRegYear = Number(firstRegYear);

    const usefulLife = (() => {
        if (cost <= 0 || !bodyType) return null;
        if (isNewCar || !fRegYear) return getUsefulLife({ bodyType, isNewCar: true, purchaseDate: new Date(pYear, 0, 1) });
        const elapsedYears = pYear - fRegYear;
        return calcUsedCarUsefulLife(
            getUsefulLife({ bodyType, isNewCar: true, purchaseDate: new Date(pYear, 0, 1) }),
            Math.max(0, elapsedYears),
        );
    })();

    const schedule: DepreciationScheduleRow[] = (() => {
        if (!cost || !usefulLife || !pYear) return [];
        try {
            return calcDepreciationSchedule({ acquisitionCost: cost, usefulLife, method, purchaseYear: pYear });
        } catch { return []; }
    })();

    const currentFY = new Date().getFullYear();
    const currentYearRow = schedule.find((r) => r.fiscalYear === currentFY);
    const remainingBook = currentYearRow?.bookValueEnd ?? (schedule.length ? schedule[schedule.length - 1].bookValueEnd : cost);
    const isFullyDep = schedule.some((r) => r.fullyDepreciated);

    if (vehicle.ownershipType === 'leased') {
        return (
            <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4" />減価償却</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-6">リース車両は減価償却の対象外です。</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-brand-500" />
                    減価償却計算
                    <span className="ml-auto text-xs text-muted-foreground font-normal">自社保有車・法人税法準拠</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">取得価額（円）</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                            <Input className="pl-7" type="number" placeholder="1650000" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">車種区分</label>
                        <Select value={bodyType} onValueChange={(v) => v && setBodyType(v as VehicleBodyType)}>
                            <SelectTrigger><SelectValue placeholder="選択">{bodyType ? VehicleBodyTypeLabel[bodyType as keyof typeof VehicleBodyTypeLabel] : ''}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(VehicleBodyTypeLabel).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">新車 / 中古</label>
                        <div className="flex">
                            {[true, false].map((v) => (
                                <button
                                    key={String(v)}
                                    onClick={() => setIsNewCar(v)}
                                    className={cn(
                                        'flex-1 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg transition-colors',
                                        isNewCar === v
                                            ? 'bg-brand-500 text-white border-brand-500'
                                            : 'border-border hover:bg-muted',
                                    )}
                                >
                                    {v ? '新車' : '中古車'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">償却方法</label>
                        <div className="flex">
                            {(['straight', 'declining'] as DepreciationMethod[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMethod(m)}
                                    className={cn(
                                        'flex-1 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg transition-colors',
                                        method === m
                                            ? 'bg-brand-500 text-white border-brand-500'
                                            : 'border-border hover:bg-muted',
                                    )}
                                >
                                    {DepreciationMethodLabel[m]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">取得年</label>
                        <Input type="number" placeholder="2021" value={purchaseYear} onChange={(e) => setPurchaseYear(e.target.value)} />
                    </div>
                    {!isNewCar && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">初度登録年（中古）</label>
                            <Input type="number" placeholder="2018" value={firstRegYear} onChange={(e) => setFirstRegYear(e.target.value)} />
                        </div>
                    )}
                </div>

                {usefulLife && cost > 0 ? (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-center">
                                <p className="text-xs text-muted-foreground mb-0.5">適用耐用年数</p>
                                <p className="text-2xl font-bold text-brand-600">{usefulLife}<span className="text-sm font-normal">年</span></p>
                                {!isNewCar && fRegYear && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">経過{pYear - fRegYear}年・短縮後</p>
                                )}
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                                <p className="text-xs text-muted-foreground mb-0.5">今期末帳簿価額</p>
                                <p className="text-xl font-bold">¥{(remainingBook).toLocaleString()}</p>
                            </div>
                            <div className={cn('p-3 rounded-xl border text-center', isFullyDep ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/50 border-border')}>
                                <p className="text-xs text-muted-foreground mb-0.5">償却状況</p>
                                <p className={cn('text-sm font-bold', isFullyDep ? 'text-green-600' : 'text-amber-600')}>
                                    {isFullyDep ? '償却完了' : '償却中'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">償却スケジュール</p>
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40">
                                            <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">年度</th>
                                            <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">期首残高</th>
                                            <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">償却額</th>
                                            <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">期末残高</th>
                                            <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">累計</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {schedule.map((row) => {
                                            const isCurrent = row.fiscalYear === currentFY;
                                            return (
                                                <tr key={row.year} className={cn('hover:bg-muted/30 transition-colors', isCurrent && 'bg-brand-500/4 font-semibold')}>
                                                    <td className="px-3 py-2 tabular-nums">
                                                        {row.fiscalYear}
                                                        {isCurrent && <span className="ml-1 text-[10px] bg-brand-500 text-white px-1 rounded">今年</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">¥{row.bookValueStart.toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-red-600">−¥{row.depreciation.toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums">¥{row.bookValueEnd.toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">¥{row.accumulatedDepreciation.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Info className="w-3 h-3" /> 備忘価額1円まで償却。定率法は200%定率法（保証率適用あり）。
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Calculator className="w-5 h-5 mr-2 opacity-50" />
                        <span className="text-sm">取得価額と車種区分を入力してください</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function VehicleDetailClient({ vehicle }: { vehicle: any }) {
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);
    const [editingInsurance, setEditingInsurance] = useState<any | null>(null);

    const accidents = Array.isArray(vehicle.accidents) ? vehicle.accidents : [];
    const insurances = Array.isArray(vehicle.insurances) ? vehicle.insurances : [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/vehicles" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 車両一覧へ戻る
            </Link>

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

            <DepreciationPanel vehicle={vehicle} />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-brand-500" />
                            保険情報
                            <Badge variant="secondary" className="ml-1">{insurances.length}件</Badge>
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => { setEditingInsurance(null); setShowInsuranceModal(true); }} className="gap-1.5 h-8">
                            <Plus className="w-3.5 h-3.5" /> 追加
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {insurances.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">登録されている保険情報はありません</p>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {insurances.map((ins: any) => (
                                <div key={ins.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 group relative cursor-pointer hover:border-brand-500/30 transition-colors"
                                    onClick={() => { setEditingInsurance(ins); setShowInsuranceModal(true); }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <Badge variant={ins.type === 'compulsory' ? 'default' : 'outline'} className={ins.type === 'compulsory' ? 'bg-blue-500 hover:bg-blue-600' : 'text-brand-600 border-brand-200 dark:border-brand-800'}>
                                                {InsuranceTypeLabel[ins.type as keyof typeof InsuranceTypeLabel]}
                                            </Badge>
                                            <p className="font-semibold mt-1.5">{ins.companyName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">保険料</p>
                                            <p className="font-semibold text-sm">{ins.premiumAmount ? `¥${ins.premiumAmount.toLocaleString()}` : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        {new Date(ins.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(ins.endDate).toLocaleDateString('ja-JP')}
                                    </div>
                                    {ins.coverageDetails && (
                                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                                            {ins.coverageDetails}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <InsuranceModal vehicleId={vehicle.id} open={showInsuranceModal} onClose={() => setShowInsuranceModal(false)} editingInsurance={editingInsurance} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        事故履歴
                        <Badge variant="secondary" className="ml-auto">{accidents.length}件</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {accidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">事故の記録はありません</p>
                    ) : (
                        <div className="space-y-3">
                            {accidents.map((acc: any) => (
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
