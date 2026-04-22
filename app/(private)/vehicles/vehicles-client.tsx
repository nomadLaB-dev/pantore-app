'use client';
import { useState } from 'react';
import { getUsefulLife } from '@/lib/depreciation';
import { Car, Plus, Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewVehicleModal } from '@/components/modals/new-vehicle-modal';
import { EditVehicleModal } from '@/components/modals/edit-vehicle-modal';

interface VehiclesClientProps {
    vehicles: any[];
    branches: any[];
    stats: {
        totalVehiclesCount: number;
        leasedCount: number;
        ownedCount: number;
        branchCount: number;
    };
}

export function VehiclesClient({ vehicles, branches, stats }: VehiclesClientProps) {
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">車両管理</h1>
                    <p className="text-muted-foreground text-sm">支社別の車両・リース情報を管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => setShowNewModal(true)}>
                    <Plus className="w-4 h-4" /> 新規登録
                </Button>
            </div>

            <NewVehicleModal open={showNewModal} onClose={() => setShowNewModal(false)} branches={branches} />
            <EditVehicleModal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedVehicle(null); }} vehicle={selectedVehicle} branches={branches} />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '管理台数', value: stats.totalVehiclesCount, icon: Car, color: 'text-blue-500' },
                    { label: 'リース台数', value: stats.leasedCount, icon: Car, color: 'text-brand-500' },
                    { label: '自社保有', value: stats.ownedCount, icon: Car, color: 'text-violet-500' },
                    { label: '登録支社数', value: stats.branchCount, icon: Building2, color: 'text-slate-500' },
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
                            {v.ownershipType === 'leased' && v.lease && (
                                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">リース情報</p>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{v.lease.leaseCompany}</span>
                                        <span className="font-medium">¥{v.lease.monthlyFee?.toLocaleString()}/月</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{new Date(v.lease.contractStartDate).toLocaleDateString('ja-JP')}</span>
                                        <span>〜 {new Date(v.lease.contractEndDate).toLocaleDateString('ja-JP')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Purchase info */}
                            {v.ownershipType === 'owned' && v.purchase && (
                                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 mt-2">
                                    <p className="font-medium text-xs text-brand-600 uppercase tracking-wide">購入・減価償却情報</p>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">取得価額: ¥{v.purchase.acquisitionCost?.toLocaleString()}</span>
                                        <span className="font-medium text-brand-600">
                                            {v.purchase.acquisitionCost ? `約 ¥${Math.floor(v.purchase.acquisitionCost / (getUsefulLife({
                                                bodyType: v.purchase.bodyType,
                                                isNewCar: v.purchase.isNewCar,
                                                purchaseDate: new Date(v.purchase.purchaseDate || new Date()),
                                                firstRegistrationDate: v.purchase.firstRegistrationDate ? new Date(v.purchase.firstRegistrationDate) : undefined
                                            }) * 12)).toLocaleString()}/月` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>想定耐用年数: {getUsefulLife({
                                            bodyType: v.purchase.bodyType,
                                            isNewCar: v.purchase.isNewCar,
                                            purchaseDate: new Date(v.purchase.purchaseDate || new Date()),
                                            firstRegistrationDate: v.purchase.firstRegistrationDate ? new Date(v.purchase.firstRegistrationDate) : undefined
                                        })}年</span>
                                        <span>取得: {v.purchase.purchaseDate ? new Date(v.purchase.purchaseDate).toLocaleDateString('ja-JP') : '-'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-1 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                        setSelectedVehicle(v);
                                        setShowEditModal(true);
                                    }}
                                >
                                    編集
                                </Button>
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

            {vehicles.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-12">登録されている車両はありません。</p>
            )}
        </div>
    );
}
