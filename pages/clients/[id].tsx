'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Truck, Users, Handshake,
    FileSpreadsheet, FileText, ChevronRight, Calendar, RefreshCw, Zap,
    Pencil, Check, X, Mail, Phone, Plus, Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DealBillingTypeLabel, DealStatusLabel } from '@/types';

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-600',
};
const invoiceStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    overdue: 'bg-red-100 text-red-600',
};
const contractStatusColors: Record<string, string> = {
    signed: 'bg-blue-100 text-blue-700',
    draft: 'bg-slate-100 text-slate-600',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    own: Building2, courier: Truck, prime: Handshake, other: Users,
};

type EditDraft = {
    department: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    billingName: string;
    billingEmail: string;
    billingAddress: string;
    areas: string[];
};

const AREA_ORDINALS = ['ファースト', 'セカンド', 'サード', 'フォース', 'フィフス',
                       'シックス', 'セブンス', 'エイス', 'ナインス', 'テンス'];

function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="font-medium text-sm">{value}</p>
        </div>
    );
}

function EditField({ label, name, value, onChange }: {
    label: string; name: keyof EditDraft; value: string;
    onChange: (k: keyof EditDraft, v: string) => void;
}) {
    return (
        <div>
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <Input
                value={value}
                onChange={e => onChange(name, e.target.value)}
                className="h-8 text-sm"
            />
        </div>
    );
}

export default function ClientDetailPage() {
    const { id } = useRouter().query;
    const qc = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<EditDraft | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: client, isLoading } = useQuery<any>({
        queryKey: ['client', id],
        queryFn: async () => (await fetch(`/api/clients/${id}`)).json(),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">読み込み中…</div>;
    if (!client || client.error) return <div className="p-8 text-center text-muted-foreground">取引先が見つかりません。</div>;

    const CategoryIcon = CATEGORY_ICONS[client.category] ?? Building2;

    const startEdit = () => {
        setDraft({
            department:     client.department     || '',
            contactName:    client.contactName    || '',
            contactEmail:   client.contactEmail   || '',
            contactPhone:   client.contactPhone   || '',
            billingName:    client.billingName    || '',
            billingEmail:   client.billingEmail   || '',
            billingAddress: client.billingAddress || '',
            areas:          client.areas?.length ? [...client.areas] : [''],
        });
        setEditing(true);
    };

    const cancelEdit = () => { setEditing(false); setDraft(null); };

    const saveEdit = async () => {
        if (!draft) return;
        setSaving(true);
        await fetch(`/api/clients/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...draft, areas: draft.areas.filter(a => a.trim()) }),
        });
        await qc.invalidateQueries({ queryKey: ['client', id] });
        setSaving(false);
        setEditing(false);
        setDraft(null);
    };

    const set = (k: keyof EditDraft, v: string) => setDraft(d => d ? { ...d, [k]: v } : d);

    const totalBilledAmount = (client.invoices ?? []).reduce((s: number, i: any) => s + i.amount, 0);
    const pendingInvoices   = (client.invoices ?? []).filter((i: any) => i.status === 'pending').length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 取引先一覧へ戻る
            </Link>

            {/* ── プロフィールカード ── */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center shrink-0">
                            <CategoryIcon className="w-7 h-7 text-brand-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold">{client.companyName}</h1>
                                    {!editing && client.department && (
                                        <p className="text-muted-foreground text-sm">{client.department}</p>
                                    )}
                                </div>
                                {!editing ? (
                                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={startEdit}>
                                        <Pencil className="w-3.5 h-3.5" /> 編集
                                    </Button>
                                ) : (
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="outline" size="sm" className="gap-1" onClick={cancelEdit}>
                                            <X className="w-3.5 h-3.5" /> キャンセル
                                        </Button>
                                        <Button size="sm" className="gap-1 bg-brand-500 hover:bg-brand-600 text-white" disabled={saving} onClick={saveEdit}>
                                            <Check className="w-3.5 h-3.5" /> {saving ? '保存中…' : '保存'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {editing && draft ? (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <EditField label="部署名"         name="department"     value={draft.department}     onChange={set} />
                                    <EditField label="担当者氏名"     name="contactName"    value={draft.contactName}    onChange={set} />
                                    <EditField label="担当者メール"   name="contactEmail"   value={draft.contactEmail}   onChange={set} />
                                    <EditField label="担当者電話"     name="contactPhone"   value={draft.contactPhone}   onChange={set} />
                                    {client.category === 'courier' && (
                                        <div className="sm:col-span-2">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs text-muted-foreground">担当エリア <span className="text-red-500">*</span></label>
                                                {draft.areas.length < 10 && (
                                                    <button type="button"
                                                        onClick={() => setDraft(d => d ? { ...d, areas: [...d.areas, ''] } : d)}
                                                        className="text-xs text-brand-600 hover:underline flex items-center gap-0.5">
                                                        <Plus className="w-3 h-3" /> 追加
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                {draft.areas.map((a, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground w-16 shrink-0">{AREA_ORDINALS[i]}</span>
                                                        <Input
                                                            value={a}
                                                            onChange={e => setDraft(d => { if (!d) return d; const next = [...d.areas]; next[i] = e.target.value; return { ...d, areas: next }; })}
                                                            placeholder={i === 0 ? '必須' : '任意'}
                                                            className="h-8 text-sm flex-1"
                                                        />
                                                        {i > 0 && (
                                                            <button type="button"
                                                                onClick={() => setDraft(d => d ? { ...d, areas: d.areas.filter((_, j) => j !== i) } : d)}
                                                                className="text-muted-foreground hover:text-red-500 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <EditField label="請求先氏名・部署" name="billingName"  value={draft.billingName}    onChange={set} />
                                    <EditField label="請求先メール"   name="billingEmail"   value={draft.billingEmail}   onChange={set} />
                                    <div className="sm:col-span-2">
                                        <EditField label="請求先住所" name="billingAddress" value={draft.billingAddress} onChange={set} />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                                    <Field label="担当者"       value={client.contactName} />
                                    <Field label="メール"       value={client.contactEmail} />
                                    <Field label="電話"         value={client.contactPhone} />
                                    {client.category === 'courier' && client.areas?.length > 0 && (
                                        <div className="sm:col-span-3">
                                            <p className="text-xs text-muted-foreground mb-1">担当エリア</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(client.areas as string[]).map((area, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-medium text-brand-700">
                                                        <span className="text-brand-400 text-[10px]">{AREA_ORDINALS[i]}</span>
                                                        {area}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(client.billingName || client.billingEmail || client.billingAddress) && (
                                        <div className="sm:col-span-3 pt-2 mt-1 border-t border-border">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">請求先</p>
                                            <div className="grid sm:grid-cols-3 gap-x-8 gap-y-2">
                                                <Field label="氏名・部署" value={client.billingName} />
                                                <Field label="メール"     value={client.billingEmail} />
                                                <Field label="住所"       value={client.billingAddress} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-3 sm:grid-cols-1 gap-3 shrink-0 w-full sm:w-36 text-center sm:text-right">
                            <div>
                                <p className="text-xs text-muted-foreground">取引件数</p>
                                <p className="text-2xl font-bold">{(client.deals ?? []).length}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">累計請求額</p>
                                <p className="text-lg font-bold">¥{totalBilledAmount.toLocaleString()}</p>
                            </div>
                            {pendingInvoices > 0 && (
                                <div>
                                    <p className="text-xs text-amber-600 text-muted-foreground">未払い請求</p>
                                    <p className="text-lg font-bold text-amber-600">{pendingInvoices} 件</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* ── 取引一覧 ── */}
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Handshake className="w-4 h-4 text-brand-500" /> 取引一覧
                    </h2>
                    {(client.deals ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm">取引がありません</p>
                    ) : (
                        (client.deals as any[]).map((d: any) => (
                            <Card key={d.id} className="hover:border-brand-400 transition-colors">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColors[d.status])}>
                                                    {DealStatusLabel[d.status as keyof typeof DealStatusLabel]}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    {d.billingType === 'recurring' ? <RefreshCw className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                                    {DealBillingTypeLabel[d.billingType as keyof typeof DealBillingTypeLabel]}
                                                </span>
                                            </div>
                                            <p className="font-semibold truncate">{d.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ¥{d.amount.toLocaleString()}{d.billingType === 'recurring' ? ' /月' : ''}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(d.startDate).toLocaleDateString('ja-JP')} 〜 {d.endDate ? new Date(d.endDate).toLocaleDateString('ja-JP') : '継続'}
                                            </div>
                                        </div>
                                        <Link href={`/deals/${d.id}`}
                                            className="shrink-0 text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5 whitespace-nowrap mt-1">
                                            詳細 <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* ── 右カラム ── */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-brand-500" /> 契約書
                        </h2>
                        {(client.contracts ?? []).length === 0 ? (
                            <p className="text-muted-foreground text-sm">契約書がありません</p>
                        ) : (
                            <div className="space-y-2">
                                {(client.contracts as any[]).map((c: any) => (
                                    <div key={c.id} className="flex items-start gap-2 p-3 border border-border rounded-xl">
                                        <div className="min-w-0">
                                            <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', contractStatusColors[c.status])}>
                                                {c.status === 'signed' ? '署名済' : '下書き'}
                                            </span>
                                            <p className="text-sm font-medium leading-snug truncate mt-1">{c.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.generatedAt).toLocaleDateString('ja-JP')} 生成</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                            <FileSpreadsheet className="w-4 h-4 text-brand-500" /> 請求履歴
                        </h2>
                        {(client.invoices ?? []).length === 0 ? (
                            <p className="text-muted-foreground text-sm">請求書がありません</p>
                        ) : (
                            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                                {(client.invoices as any[]).map((inv: any) => (
                                    <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium">{inv.number}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString('ja-JP')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold tabular-nums">¥{inv.amount.toLocaleString()}</p>
                                            <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', invoiceStatusColors[inv.status])}>
                                                {inv.status === 'paid' ? '支払済' : inv.status === 'pending' ? '未払い' : '延滞'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

ClientDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
