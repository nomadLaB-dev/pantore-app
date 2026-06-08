'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Car, Building2, AlertTriangle, CalendarDays, Receipt,
    TrendingDown, Calculator, Info, ShieldCheck, Plus, Snowflake, ChartNoAxesColumnIncreasing, Wrench,
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
import { updateVehiclePurchase } from '@/lib/actions/vehicle.actions';
import { InsuranceTypeLabel, InspectionTypeLabel } from '@/types';
import { InsuranceModal } from '@/components/modals/insurance-modal';
import { NewMileageModal } from '@/components/modals/new-mileage-modal';
import { MileageHistoryModal } from '@/components/modals/mileage-history-modal';
import { InspectionModal } from '@/components/modals/inspection-modal';
import { InspectionHistoryModal } from '@/components/modals/inspection-history-modal';
import { VehicleAccidentsModal } from '@/components/modals/vehicle-accidents-modal';
import { AccidentHistoryModal } from '@/components/modals/accident-history-modal';
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
    // 1. 初期値を取得（nullの場合はデフォルト値を設定）
    const initialPurchase = vehicle.purchase || {
        acquisitionCost: '',
        bodyType: 'passenger_standard',
        isNewCar: true,
        purchaseDate: '',
        firstRegistrationDate: '',
        method: 'straight'
    };

    const [acquisitionCost, setAcquisitionCost] = useState<string>(initialPurchase?.acquisitionCost ? String(initialPurchase.acquisitionCost) : '');
    const [bodyType, setBodyType] = useState<VehicleBodyType>(initialPurchase?.bodyType ?? 'passenger_standard');
    const [isNewCar, setIsNewCar] = useState<boolean>(initialPurchase?.isNewCar ?? true);
    const [purchaseDate, setPurchaseDate] = useState<string>(initialPurchase?.purchaseDate ?? '');
    const [firstRegDate, setFirstRegDate] = useState<string>(initialPurchase?.firstRegistrationDate ?? '');
    const [method, setMethod] = useState<DepreciationMethod>(initialPurchase?.method ?? 'straight');

    const [isPending, startTransition] = useTransition();

    // 3. 変更検知（初期値と比較）
    const isDirty =
        acquisitionCost !== String(initialPurchase.acquisitionCost || '') ||
        bodyType !== initialPurchase.bodyType ||
        isNewCar !== initialPurchase.isNewCar ||
        purchaseDate !== (initialPurchase.purchaseDate || '') ||
        firstRegDate !== (initialPurchase.firstRegistrationDate || '') ||
        method !== initialPurchase.method;

    const handleSave = () => {
        if (!isDirty) return; // 念のためのガード
        startTransition(async () => {
            try {
                // DB更新用のアクションを呼び出し
                await updateVehiclePurchase(vehicle.id, {
                    acquisitionCost: Number(acquisitionCost),
                    bodyType,
                    isNewCar,
                    purchaseDate,
                    firstRegistrationDate: firstRegDate || null,
                    method
                });
                // 必要であればここで router.refresh() 等を実行してデータを再取得し、
                // 親コンポーネント経由で初期値を更新するのがベストプラクティスです。
            } catch (err) {
                console.error("Failed to update purchase info", err);
            }
        });
    };

    const cost = Number(acquisitionCost);
    const pYear = purchaseDate ? new Date(purchaseDate).getFullYear() : new Date().getFullYear();
    const fRegYear = firstRegDate ? new Date(firstRegDate).getFullYear() : 0;

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
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                <CardTitle className="text-base flex items-center gap-2 m-0">
                    <TrendingDown className="w-4 h-4 text-brand-500" />
                    購入・減価償却設定
                </CardTitle>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground font-normal hidden sm:inline-block">自社保有車・法人税法準拠</span>
                    <Button size="sm" onClick={handleSave} disabled={isPending || !purchaseDate || !isDirty} className="bg-brand-500 hover:bg-brand-600 text-white shadow-sm h-8">
                        {isPending ? '保存中...' : '設定を保存'}
                    </Button>
                </div>
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
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">取得日</label>
                        <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                    </div>
                    {!isNewCar && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">初度登録年月（中古）</label>
                            <Input type="month" value={firstRegDate ? firstRegDate.substring(0, 7) : ''} onChange={(e) => setFirstRegDate(e.target.value ? `${e.target.value}-01` : '')} />
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
    const [showMileageModal, setShowMileageModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [showInspectionHistoryModal, setShowInspectionHistoryModal] = useState(false);
    const [showAccidentModal, setShowAccidentModal] = useState(false);
    const [showAccidentHistoryModal, setShowAccidentHistoryModal] = useState(false);
    const [editingInsurance, setEditingInsurance] = useState<any | null>(null);
    const [editingMileage, setEditingMileage] = useState<any | null>(null);
    const [editingInspection, setEditingInspection] = useState<any | null>(null);
    const [editingAccident, setEditingAccident] = useState<any | null>(null);

    const accidents = Array.isArray(vehicle.accidents) ? vehicle.accidents : [];
    const insurances = Array.isArray(vehicle.insurances) ? vehicle.insurances : [];
    const mileages = Array.isArray(vehicle.mileages) ? vehicle.mileages : [];
    const inspections = Array.isArray(vehicle.inspections) ? vehicle.inspections : [];

    // 直近12ヶ月の年月 (YYYY-MM) を生成
    const getPast12Months = () => {
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            months.push(`${year}-${month}`);
        }
        return months;
    };

    const months = getPast12Months();

    // 各月の実走行距離 (最後の測定値 - 最初の測定値) を計算
    const monthlyDistances = months.map(m => {
        const monthRecords = mileages.filter((rec: any) => rec.recordDate.startsWith(m));
        if (monthRecords.length === 0) {
            return { label: parseInt(m.split('-')[1], 10) + '月', distance: 0, fullLabel: m };
        }
        const vals = monthRecords.map((r: any) => Number(r.mileage));
        const maxVal = Math.max(...vals);
        const minVal = Math.min(...vals);
        const distance = maxVal - minVal;
        return {
            label: parseInt(m.split('-')[1], 10) + '月',
            distance: distance > 0 ? distance : 0,
            fullLabel: m
        };
    });

    const maxDistance = Math.max(...monthlyDistances.map(d => d.distance), 1);
    const latestMileage = mileages[0];

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
                            {vehicle.tireType === 'studless' && (
                                <Snowflake className="w-4 h-4 text-sky-500 shrink-0" />
                            )}
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
            <NewMileageModal vehicleId={vehicle.id} open={showMileageModal} onClose={() => setShowMileageModal(false)} editingMileage={editingMileage} />
            <MileageHistoryModal
                open={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                mileages={mileages}
                onEditMileage={(m) => {
                    setEditingMileage(m);
                    setShowMileageModal(true);
                }}
            />
            <InspectionModal vehicleId={vehicle.id} open={showInspectionModal} onClose={() => setShowInspectionModal(false)} editingInspection={editingInspection} accidents={accidents} />
            <InspectionHistoryModal
                open={showInspectionHistoryModal}
                onClose={() => setShowInspectionHistoryModal(false)}
                inspections={inspections}
                onEditInspection={(insp) => {
                    setEditingInspection(insp);
                    setShowInspectionModal(true);
                }}
            />
            <VehicleAccidentsModal
                vehicleId={vehicle.id}
                v_accidentsId={editingAccident?.id || ''}
                record={editingAccident}
                open={showAccidentModal}
                onClose={() => setShowAccidentModal(false)}
            />
            <AccidentHistoryModal
                open={showAccidentHistoryModal}
                onClose={() => setShowAccidentHistoryModal(false)}
                accidents={accidents}
                onEditAccident={(acc) => {
                    setEditingAccident(acc);
                    setShowAccidentModal(true);
                }}
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2 m-0">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            事故履歴
                            <Badge variant="secondary" className="ml-1">{accidents.length}件</Badge>
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => { setEditingAccident(null); setShowAccidentModal(true); }} className="gap-1.5 h-8">
                            <Plus className="w-3.5 h-3.5" /> 追加
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {accidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">事故の記録はありません</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {accidents.slice(0, 3).map((acc: any) => (
                                    <div key={acc.id} className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-4 group">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                <span>
                                                    {acc.accidentDate ? new Date(acc.accidentDate).toLocaleDateString('ja-JP') : '—'}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityMap[acc.severity as keyof typeof severityMap].class}`}>
                                                    {severityMap[acc.severity as keyof typeof severityMap].label}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{acc.description}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                            onClick={() => {
                                                setEditingAccident(acc);
                                                setShowAccidentModal(true);
                                            }}
                                        >
                                            編集
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => setShowAccidentHistoryModal(true)}
                                >
                                    全データを閲覧 ({accidents.length}件)
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-brand-500" />
                            点検情報
                            <Badge variant="secondary" className="ml-1">{inspections.length}件</Badge>
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => { setEditingInspection(null); setShowInspectionModal(true); }} className="gap-1.5 h-8">
                            <Plus className="w-3.5 h-3.5" /> 追加
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {inspections.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">点検情報はありません</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {inspections.slice(0, 3).map((insp: any) => (
                                    <div key={insp.id} className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-4 group">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">
                                                    {InspectionTypeLabel[insp.inspectionType as keyof typeof InspectionTypeLabel] || '不明な点検'}
                                                </span>
                                                {insp.inspectionCost && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ¥{Number(insp.inspectionCost).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                <div className="flex items-center gap-1.5 font-mono">
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    <span>
                                                        期間: {insp.inspectionStartDate ? new Date(insp.inspectionStartDate).toLocaleDateString('ja-JP') : '—'}
                                                        {insp.inspectionEndDate ? ` 〜 ${new Date(insp.inspectionEndDate).toLocaleDateString('ja-JP')}` : ''}
                                                    </span>
                                                </div>
                                                {(insp.nextInspectionMileage || insp.nextInspectionDate) && (
                                                    <div className="text-brand-600 dark:text-brand-400 font-mono pl-5">
                                                        次回目安: {insp.nextInspectionMileage ? `${Number(insp.nextInspectionMileage).toLocaleString()} km` : ''}
                                                        {insp.nextInspectionMileage && insp.nextInspectionDate ? ' / ' : ''}
                                                        {insp.nextInspectionDate ? new Date(insp.nextInspectionDate).toLocaleDateString('ja-JP') : ''}
                                                    </div>
                                                )}
                                                {insp.notes && (
                                                    <div className="text-slate-500 italic pl-5 text-[11px]">
                                                        備考: {insp.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                            onClick={() => {
                                                setEditingInspection(insp);
                                                setShowInspectionModal(true);
                                            }}
                                        >
                                            編集
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => setShowInspectionHistoryModal(true)}
                                >
                                    全データを閲覧 ({inspections.length}件)
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ChartNoAxesColumnIncreasing className="w-4 h-4" />
                            走行距離
                            <Badge variant="secondary" className="ml-1">{mileages.length}件</Badge>
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => { setEditingMileage(null); setShowMileageModal(true); }} className="gap-1.5 h-8">
                            <Plus className="w-3.5 h-3.5" /> 追加
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {mileages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">走行距離の記録はありません</p>
                    ) : (
                        <div className="space-y-4">
                            {/* 1. グラフの表示 */}
                            <div className="bg-muted/30 rounded-xl p-4 border border-border">
                                <p className="text-xs text-muted-foreground mb-3 font-medium">月間実走行距離 (km) - 直近12ヶ月</p>
                                <div className="flex justify-between items-end h-40 pt-4 px-2">
                                    {monthlyDistances.map((d, idx) => {
                                        const percentage = (d.distance / maxDistance) * 100;
                                        return (
                                            <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group relative">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                                                    {d.fullLabel}: {d.distance.toLocaleString()} km
                                                </div>
                                                {/* Bar */}
                                                <div
                                                    className="w-4 sm:w-6 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-t-sm transition-all duration-300 relative"
                                                    style={{ height: `${percentage > 0 ? Math.max(percentage, 4) : 0}%` }}
                                                />
                                                {/* Label */}
                                                <span className="text-[10px] text-muted-foreground mt-2 font-mono">
                                                    {d.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. 最新の走行距離 */}
                            {latestMileage && (
                                <div className="border-t border-border pt-4">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">最新の走行距離</p>
                                    <div className="p-4 rounded-xl border border-border flex items-center justify-between bg-muted/20">
                                        <div className="flex items-center gap-4">
                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                                                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                                                {new Date(latestMileage.recordDate).toLocaleDateString('ja-JP')}
                                            </div>
                                            <div className="font-semibold text-sm">
                                                {latestMileage.mileage ? Number(latestMileage.mileage).toLocaleString() : '0'} km
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                            onClick={() => {
                                                setEditingMileage(latestMileage);
                                                setShowMileageModal(true);
                                            }}
                                        >
                                            編集
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* 3. 過去分の閲覧ボタン */}
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => setShowHistoryModal(true)}
                                >
                                    全データを閲覧 ({mileages.length}件)
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
