'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Building2, FileText, ReceiptText, FileSearch, Plus, Search, Filter, Mail, Phone, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const REQUIRED_FIELDS = ['companyName', 'contactName'] as const;

const empty = {
    companyName: '',
    department: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    billingName: '',
    billingEmail: '',
    billingAddress: '',
};

function NewClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleClose = () => { setForm(empty); setErrors([]); onClose(); };

    const handleSave = async () => {
        const missing = REQUIRED_FIELDS.filter((f) => !form[f as keyof typeof form].trim());
        if (missing.length) { setErrors(missing); return; }
        setSaving(true);
        await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        await qc.invalidateQueries({ queryKey: ['clients'] });
        setSaving(false);
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>取引先を追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">会社情報</p>
                        <div className="space-y-2.5">
                            <div>
                                <label className="text-sm font-medium mb-1 block">会社名 <span className="text-red-500">*</span></label>
                                <Input placeholder="株式会社〇〇" value={form.companyName} onChange={set('companyName')}
                                    className={cn(errors.includes('companyName') && 'border-red-400')} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">部署名</label>
                                <Input placeholder="食品事業部" value={form.department} onChange={set('department')} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">担当者</p>
                        <div className="space-y-2.5">
                            <div>
                                <label className="text-sm font-medium mb-1 block">氏名 <span className="text-red-500">*</span></label>
                                <Input placeholder="田村 誠司" value={form.contactName} onChange={set('contactName')}
                                    className={cn(errors.includes('contactName') && 'border-red-400')} />
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">メール</label>
                                    <Input type="email" placeholder="contact@example.com" value={form.contactEmail} onChange={set('contactEmail')} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">電話番号</label>
                                    <Input placeholder="03-1234-5678" value={form.contactPhone} onChange={set('contactPhone')} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">請求先</p>
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">請求先氏名・部署</label>
                                    <Input placeholder="経理部" value={form.billingName} onChange={set('billingName')} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">請求先メール</label>
                                    <Input type="email" placeholder="billing@example.com" value={form.billingEmail} onChange={set('billingEmail')} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">請求先住所</label>
                                <Input placeholder="東京都港区南青山2-2-15" value={form.billingAddress} onChange={set('billingAddress')} />
                            </div>
                        </div>
                    </div>

                    {errors.length > 0 && (
                        <div className="flex items-center gap-1.5 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" /> 必須項目を入力してください
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={handleClose}>キャンセル</Button>
                    <Button className="bg-brand-500 hover:bg-brand-600 text-white" disabled={saving} onClick={handleSave}>
                        {saving ? '保存中…' : '追加する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ClientsPage() {
    const router = useRouter();
    const [newModal, setNewModal] = useState(false);
    const [search, setSearch] = useState('');

    const { data: clients = [], isLoading } = useQuery<any[]>({
        queryKey: ['clients'],
        queryFn: async () => (await fetch('/api/clients')).json(),
    });

    const filtered = clients.filter((c) =>
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">取引先</h1>
                    <p className="text-muted-foreground text-sm">{clients.length} 社</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2 self-start sm:self-auto" onClick={() => setNewModal(true)}>
                    <Plus className="w-4 h-4" /> 取引先を追加
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="会社名・担当者名で検索…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
                <p className="text-muted-foreground text-center py-12">読み込み中…</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Building2 className="w-12 h-12 mb-4 opacity-30" />
                    <p>取引先がありません</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((c: any) => (
                        <Card key={c.id} className="hover:border-brand-400 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/clients/${c.id}`)}>
                            <CardContent className="pt-5 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-brand-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold truncate group-hover:text-brand-600 transition-colors">{c.companyName}</p>
                                        {c.department && <p className="text-xs text-muted-foreground truncate">{c.department}</p>}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-medium text-foreground">{c.contactName}</span>
                                    </div>
                                    {c.contactEmail && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate text-xs">{c.contactEmail}</span>
                                        </div>
                                    )}
                                    {c.contactPhone && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Phone className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-xs">{c.contactPhone}</span>
                                        </div>
                                    )}
                                </div>

                                {c.billingAddress && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs text-muted-foreground">請求先: <span className="text-foreground">{c.billingAddress}</span></p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <NewClientModal open={newModal} onClose={() => setNewModal(false)} />
        </div>
    );
}
