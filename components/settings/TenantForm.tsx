'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TenantForm({ initialData }: { initialData: any }) {
    const queryClient = useQueryClient();
    const [savedTenant, setSavedTenant] = useState(false);

    // RSCで取得した初期データをセット
    const [tenant, setTenant] = useState({
        name: initialData?.name || '',
        billingName: initialData?.billing_name || '',
        billingEmail: initialData?.billing_email || '',
        billingAddress: initialData?.billing_address || '',
    });

    const tenantUpdate = useMutation({
        mutationFn: async (data: typeof tenant) => {
            const res = await fetch('/api/tenants', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update tenant');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant'] });
            setSavedTenant(true);
            setTimeout(() => setSavedTenant(false), 2000);
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-500" /> テナント設定
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">会社名 / 組織名</label>
                    <Input value={tenant.name} onChange={(e) => setTenant({ ...tenant, name: e.target.value })} />
                </div>

                <div className="pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">請求先情報</p>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">担当者名</label>
                                <Input value={tenant.billingName} onChange={(e) => setTenant({ ...tenant, billingName: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">請求先メール</label>
                                <Input type="email" value={tenant.billingEmail} onChange={(e) => setTenant({ ...tenant, billingEmail: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">住所</label>
                            <Input value={tenant.billingAddress} onChange={(e) => setTenant({ ...tenant, billingAddress: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white gap-2"
                        disabled={tenantUpdate.isPending}
                        onClick={() => tenantUpdate.mutate(tenant)}
                    >
                        {savedTenant ? <><CheckCircle2 className="w-4 h-4" /> 保存しました</> : <><Save className="w-4 h-4" /> 変更を保存</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
