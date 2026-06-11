'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'
import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { Building2, Truck, Users, Handshake, Plus, Search, Mail, Phone, AlertCircle, Upload, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ClientCategory = 'own' | 'courier' | 'prime' | 'other';

const TABS: { key: ClientCategory; label: string; icon: React.ElementType }[] = [
    { key: 'own',     label: '自社',     icon: Building2 },
    { key: 'courier', label: '配送業者', icon: Truck },
    { key: 'prime',   label: '元請け',   icon: Handshake },
    { key: 'other',   label: 'その他',   icon: Users },
];

const CATEGORY_ICONS: Record<ClientCategory, React.ElementType> = {
    own:     Building2,
    courier: Truck,
    prime:   Handshake,
    other:   Users,
};

const REQUIRED_FIELDS = ['companyName'] as const;
type RequiredKey = typeof REQUIRED_FIELDS[number];

const makeEmpty = (category: ClientCategory) => ({
    companyName: '',
    department: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    billingName: '',
    billingEmail: '',
    billingAddress: '',
    areas: [''],
    category,
});

const AREA_ORDINALS = ['ファースト', 'セカンド', 'サード', 'フォース', 'フィフス',
                       'シックス', 'セブンス', 'エイス', 'ナインス', 'テンス'];

function NewClientModal({ open, defaultCategory, onClose }: { open: boolean; defaultCategory: ClientCategory; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState(() => makeEmpty(defaultCategory));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleClose = () => { setForm(makeEmpty(defaultCategory)); setErrors([]); onClose(); };

    const handleSave = async () => {
        const missing: string[] = REQUIRED_FIELDS.filter((f) => !form[f as RequiredKey].trim());
        if (form.category === 'courier' && !form.areas[0]?.trim()) missing.push('areas');
        if (missing.length) { setErrors(missing); return; }
        setSaving(true);
        const payload = { ...form, areas: form.areas.filter(a => a.trim()) };
        await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">区分</p>
                        <div className="flex gap-2">
                            {TABS.map(t => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, category: t.key }))}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                                        form.category === t.key
                                            ? 'bg-brand-500 text-white border-brand-500'
                                            : 'bg-white text-muted-foreground border-border hover:bg-muted/50',
                                    )}
                                >
                                    <t.icon className="w-3.5 h-3.5" />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

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
                            {form.category === 'courier' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-sm font-medium">担当エリア <span className="text-red-500">*</span></label>
                                        {form.areas.length < 10 && (
                                            <button type="button" onClick={() => setForm(f => ({ ...f, areas: [...f.areas, ''] }))}
                                                className="text-xs text-brand-600 hover:underline flex items-center gap-0.5">
                                                <Plus className="w-3 h-3" /> エリアを追加
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {form.areas.map((a, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-20 shrink-0">{AREA_ORDINALS[i]}エリア</span>
                                                <Input
                                                    value={a}
                                                    onChange={e => setForm(f => { const next = [...f.areas]; next[i] = e.target.value; return { ...f, areas: next }; })}
                                                    placeholder={i === 0 ? '高知県（必須）' : '任意'}
                                                    className={cn('flex-1', i === 0 && errors.includes('areas') && 'border-red-400')}
                                                />
                                                {i > 0 && (
                                                    <button type="button" onClick={() => setForm(f => ({ ...f, areas: f.areas.filter((_, j) => j !== i) }))}
                                                        className="text-muted-foreground hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">担当者</p>
                        <div className="space-y-2.5">
                            <div>
                                <label className="text-sm font-medium mb-1 block">氏名</label>
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

const CSV_COLUMNS = [
    'category', 'company_name', 'areas', 'department',
    'contact_name', 'contact_email', 'contact_phone',
    'billing_name', 'billing_email', 'billing_address',
] as const;

type CsvRow = { [K in typeof CSV_COLUMNS[number]]?: string } & { _error?: string };

function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: CsvRow = {};
        headers.forEach((h, i) => { (row as any)[h] = vals[i] ?? ''; });
        if (!row.company_name) row._error = 'company_name が必須です';
        else if (row.category === 'courier' && !row.areas) row._error = 'courier は areas が必須です';
        return row;
    });
}

function CsvImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const qc = useQueryClient();
    const [rows, setRows] = useState<CsvRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [done, setDone] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const text = ev.target?.result as string;
            setRows(parseCsv(text));
            setDone(false);
        };
        reader.readAsText(file, 'utf-8');
        e.target.value = '';
    };

    const validRows = rows.filter(r => !r._error);
    const errorRows = rows.filter(r => r._error);

    const handleImport = async () => {
        if (!validRows.length) return;
        setImporting(true);
        await Promise.all(validRows.map(r =>
            fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName:    r.company_name    || '',
                    category:       (r.category as ClientCategory) || 'other',
                    areas:          r.areas           || '',
                    department:     r.department      || '',
                    contactName:    r.contact_name    || '',
                    contactEmail:   r.contact_email   || '',
                    contactPhone:   r.contact_phone   || '',
                    billingName:    r.billing_name    || '',
                    billingEmail:   r.billing_email   || '',
                    billingAddress: r.billing_address || '',
                }),
            })
        ));
        await qc.invalidateQueries({ queryKey: ['clients'] });
        setImporting(false);
        setDone(true);
    };

    const handleClose = () => { setRows([]); setDone(false); onClose(); };

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>CSVインポート</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 font-mono">
                        期待するヘッダー: {CSV_COLUMNS.join(', ')}
                    </div>

                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">CSVファイルを選択（.csv）</span>
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                    </label>

                    {rows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> {validRows.length} 件インポート可
                                </span>
                                {errorRows.length > 0 && (
                                    <span className="flex items-center gap-1 text-red-500 font-medium">
                                        <XCircle className="w-4 h-4" /> {errorRows.length} 件スキップ
                                    </span>
                                )}
                            </div>

                            <div className="max-h-52 overflow-y-auto border border-border rounded-lg text-xs">
                                <table className="w-full">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">会社名</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">区分</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">エリア</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">担当者</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">状態</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {rows.map((r, i) => (
                                            <tr key={i} className={r._error ? 'bg-red-50' : 'bg-white'}>
                                                <td className="px-3 py-2">{r.company_name || '—'}</td>
                                                <td className="px-3 py-2">{r.category || '—'}</td>
                                                <td className="px-3 py-2">{r.areas || '—'}</td>
                                                <td className="px-3 py-2">{r.contact_name || '—'}</td>
                                                <td className="px-3 py-2">
                                                    {r._error
                                                        ? <span className="text-red-500">{r._error}</span>
                                                        : <span className="text-emerald-600">OK</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {done && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" /> {validRows.length} 件インポートしました
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={handleClose}>閉じる</Button>
                    {!done && (
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={importing || validRows.length === 0}
                            onClick={handleImport}
                        >
                            {importing ? 'インポート中…' : `${validRows.length} 件インポート`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ClientsPage() {
    const router = useRouter();
    const [tab, setTab] = useState<ClientCategory>('own');
    const [newModal, setNewModal] = useState(false);
    const [importModal, setImportModal] = useState(false);
    const [search, setSearch] = useState('');
    const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleAddButtonClick = useCallback(() => {
        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
            setImportModal(true);
        } else {
            clickTimer.current = setTimeout(() => {
                clickTimer.current = null;
                setNewModal(true);
            }, 250);
        }
    }, []);

    const { data: clients = [], isLoading } = useQuery<any[]>({
        queryKey: ['clients'],
        queryFn: async () => (await fetch('/api/clients')).json(),
    });

    const tabClients = clients.filter((c) => (c.category || 'other') === tab);

    const filtered = tabClients.filter((c) =>
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName.toLowerCase().includes(search.toLowerCase())
    );

    const Icon = CATEGORY_ICONS[tab];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">取引先</h1>
                    <p className="text-muted-foreground text-sm">{clients.length} 社</p>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white gap-2 self-start sm:self-auto" onClick={handleAddButtonClick}>
                    <Plus className="w-4 h-4" /> 取引先を追加
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
                {TABS.map(t => {
                    const count = clients.filter(c => (c.category || 'other') === t.key).length;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                                tab === t.key
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                            )}
                        >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                            <span className={cn(
                                'ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold',
                                tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-muted text-muted-foreground',
                            )}>{count}</span>
                        </button>
                    );
                })}
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
                    <Icon className="w-12 h-12 mb-4 opacity-30" />
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
                                        <Icon className="w-5 h-5 text-brand-500" />
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

                                {(c.areas?.length > 0 || c.billingAddress) && (
                                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                                        {c.areas?.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                エリア: <span className="text-foreground">{c.areas.join(' / ')}</span>
                                            </p>
                                        )}
                                        {c.billingAddress && (
                                            <p className="text-xs text-muted-foreground">請求先: <span className="text-foreground">{c.billingAddress}</span></p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <NewClientModal open={newModal} defaultCategory={tab} onClose={() => setNewModal(false)} />
            <CsvImportModal open={importModal} onClose={() => setImportModal(false)} />
        </div>
    );
}

ClientsPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
