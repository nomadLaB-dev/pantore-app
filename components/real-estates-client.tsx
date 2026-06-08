'use client';

import { useState } from 'react';
import { Building2, Plus, MapPin, FileText, RotateCcw, MessageCircleWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewRealEstateModal } from '@/components/modals/new-real-estate-modal';
import { EditRealEstateModal } from '@/components/modals/edit-real-estate-modal';

interface RealEstatesClientProps {
    estates: any[];
    stats: {
        totalEstates: number;
        notAppliedCount: number;
        aboutToExpireCount: number;
    };
    masters: {
        tenants: { id: string; name: string }[];
        branches: { id: string; name: string }[];
        usageTypes: string[];
        registrationStatuses: string[];
    };
}

const usageTypeMap: Record<string, string> = {
    'office': '事務所',
    'commercial_office': 'オフィス',
    'warehouse': '倉庫',
    'parking_lot': '駐車場',
    'other': 'その他'
};

const regStatusMap: Record<string, string> = {
    'not_applied': '未申請',
    'not_required': '申請不要',
    'applied': '申請済み'
};

const isAboutToExpire = (endDateStr: string | null | undefined) => {
    if (!endDateStr) return false;
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
};

export function RealEstatesClient({ estates, stats, masters }: RealEstatesClientProps) {
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEstate, setSelectedEstate] = useState<any>(null);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">不動産管理</h1>
                    <p className="text-muted-foreground text-sm">オフィスや倉庫など保有・賃貸物件を一元管理します。</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2" onClick={() => setShowNewModal(true)}>
                    <Plus className="w-4 h-4" /> 新規登録
                </Button>
                <NewRealEstateModal open={showNewModal} onClose={() => setShowNewModal(false)} masters={masters} />
                <EditRealEstateModal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedEstate(null); }} estate={selectedEstate} masters={masters} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: '管理物件', value: stats.totalEstates, icon: Building2, color: 'text-brand-500' },
                    { label: '未申請', value: stats.notAppliedCount, icon: MessageCircleWarning, color: 'text-red-500' },
                    { label: 'そろそろ更新', value: stats.aboutToExpireCount, icon: RotateCcw, color: 'text-green-600' },
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

            {/* Estate cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {estates.map((e) => (
                    <Card key={e.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-1.5">
                                            <span>{e.name}</span>
                                            {e.officeRegistrationStatus === 'not_applied' && (
                                                <MessageCircleWarning className="w-4 h-4 text-red-500 shrink-0" />
                                            )}
                                            {isAboutToExpire(e.contract?.endDate) && (
                                                <RotateCcw className="w-4 h-4 text-green-600 shrink-0" />
                                            )}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />{e.address}
                                        </p>
                                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                                            <span>会社: {masters.tenants.find(t => t.id === e.tenantId)?.name || '未設定'}</span>
                                            <span>•</span>
                                            <span>支社: {masters.branches.find(b => b.id === e.branchesId)?.name || '未設定'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <Badge variant={e.ownershipType === 'leased' ? 'secondary' : 'outline'}>
                                        {e.ownershipType === 'leased' ? '賃借' : '自社保有'}
                                    </Badge>
                                    {e.officeRegistrationStatus && (
                                        <Badge variant={e.officeRegistrationStatus === 'applied' ? 'default' : 'outline'} className={e.officeRegistrationStatus === 'applied' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                            {regStatusMap[e.officeRegistrationStatus] || e.officeRegistrationStatus}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {e.usages.map((u: any) => (
                                <div key={u.id} className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between">
                                    <span className="text-muted-foreground">{usageTypeMap[u.type] || u.type}</span>
                                    <span className="font-medium">{u.floorArea} m²</span>
                                </div>
                            ))}
                            {e.contract && (
                                <div className="text-xs text-muted-foreground flex items-center gap-2 p-2 border border-border rounded-lg">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>{e.contract.landlord} ／ ¥{e.contract.monthlyRent.toLocaleString()}/月</span>
                                    <span className="ml-auto">{e.contract.endDate ? `${new Date(e.contract.endDate).toLocaleDateString('ja-JP')}まで` : '契約期間未定'}</span>
                                </div>
                            )}

                            <div className="flex justify-end pt-1 gap-2 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                        setSelectedEstate(e);
                                        setShowEditModal(true);
                                    }}
                                >
                                    編集
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {estates.length === 0 && (
                    <p className="text-muted-foreground text-sm col-span-2 text-center py-12">登録されている不動産はありません。</p>
                )}
            </div>
        </div>
    );
}
