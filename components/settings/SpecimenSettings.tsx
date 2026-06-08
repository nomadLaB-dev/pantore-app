'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Check, X, Loader2, MapPin, Building2, Truck, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'areas' | 'facilities' | 'couriers';
type Status = { type: 'success' | 'error'; message: string } | null;

type DeliveryArea = { id: string; tenant_id: string; name: string; description: string };
type Facility    = { id: string; tenant_id: string; facility: string; area: string; location_name: string; address: string };
type Courier     = { id: string; tenant_id: string; name: string; area: string; url: string };

// ── CSV ユーティリティ ─────────────────────────────
function escapeCsv(val: string | null | undefined): string {
    const s = val ?? '';
    return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
}

function parseCsvRow(line: string): string[] {
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
            else { inQuote = !inQuote; }
        } else if (c === ',' && !inQuote) {
            cols.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    cols.push(cur.trim());
    return cols;
}

function parseCsv(text: string): string[][] {
    const lines = text.trim().split(/\r?\n/);
    return lines.slice(1).filter(l => l.trim()).map(parseCsvRow);
}

function downloadCsv(content: string, filename: string) {
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ── 共通 UI ────────────────────────────────────────
function DeleteButton({ onDelete }: { onDelete: () => void }) {
    const [confirming, setConfirming] = useState(false);
    if (confirming) {
        return (
            <div className="flex items-center gap-1 shrink-0">
                <button onClick={onDelete} className="text-xs text-red-600 font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">削除</button>
                <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted transition-colors">戻る</button>
            </div>
        );
    }
    return (
        <button onClick={() => setConfirming(true)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    );
}

function Field({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
    return (
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder + (required ? ' *' : '')}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"
        />
    );
}

function SaveCancel({ onSave, onCancel, saving, disabled }: { onSave: () => void; onCancel: () => void; saving: boolean; disabled?: boolean }) {
    return (
        <div className="flex gap-1 shrink-0">
            <button onClick={onSave} disabled={saving || disabled} className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={onCancel} className="p-1.5 rounded hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

function CsvToolbar({ onExport, onImport, importing, onAdd, status }: {
    onExport: () => void;
    onImport: (file: File) => void;
    importing: boolean;
    onAdd: () => void;
    status: Status;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1.5">
                    <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                        <Download className="w-3.5 h-3.5" /> エクスポート
                    </button>
                    <label className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg transition-colors',
                        importing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted cursor-pointer',
                    )}>
                        {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        インポート
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            disabled={importing}
                            onChange={e => { const f = e.target.files?.[0]; if (f) { onImport(f); e.target.value = ''; } }}
                        />
                    </label>
                </div>
                <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> 追加
                </button>
            </div>
            {status && (
                <p className={cn(
                    'text-xs px-3 py-2 rounded-lg',
                    status.type === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                )}>
                    {status.message}
                </p>
            )}
        </div>
    );
}

function useStatus() {
    const [status, setStatus] = useState<Status>(null);
    const show = (s: Status) => { setStatus(s); setTimeout(() => setStatus(null), 5000); };
    return { status, show };
}

// ════════════════════════════════════════════════════
// 配送エリアマスタ
// ════════════════════════════════════════════════════
function DeliveryAreasMaster({ tenantId }: { tenantId: string }) {
    const supabase = createClient();
    const [areas, setAreas]         = useState<DeliveryArea[]>([]);
    const [loading, setLoading]     = useState(true);
    const [form, setForm]           = useState<Partial<DeliveryArea> | null>(null);
    const [saving, setSaving]       = useState(false);
    const [importing, setImporting] = useState(false);
    const { status, show } = useStatus();

    useEffect(() => {
        supabase.from('settings_delivery_areas').select('*').order('created_at').then(({ data }) => {
            setAreas(data ?? []);
            setLoading(false);
        });
    }, []);

    const save = async () => {
        if (!form?.name?.trim()) return;
        setSaving(true);
        try {
            const payload = { tenant_id: tenantId, name: form.name.trim(), description: form.description?.trim() ?? '' };
            if (form.id) {
                const { data } = await supabase.from('settings_delivery_areas').update(payload).eq('id', form.id).select().maybeSingle();
                if (data) setAreas(prev => prev.map(a => a.id === data.id ? data : a));
            } else {
                const { data } = await supabase.from('settings_delivery_areas').insert(payload).select().maybeSingle();
                if (data) setAreas(prev => [...prev, data]);
            }
            setForm(null);
        } finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        await supabase.from('settings_delivery_areas').delete().eq('id', id);
        setAreas(prev => prev.filter(a => a.id !== id));
    };

    const exportCsv = () => {
        const rows = areas.map(a => `${escapeCsv(a.name)},${escapeCsv(a.description)}`);
        downloadCsv(['name,description', ...rows].join('\n'), '配送エリア.csv');
    };

    const importCsv = async (file: File) => {
        setImporting(true);
        try {
            const text = await file.text();
            const records = parseCsv(text)
                .map(cols => ({ tenant_id: tenantId, name: cols[0] ?? '', description: cols[1] ?? '' }))
                .filter(r => r.name.trim());
            if (!records.length) { show({ type: 'error', message: '有効なデータが見つかりませんでした。ヘッダー行: name,description' }); return; }
            const { data, error } = await supabase.from('settings_delivery_areas').insert(records).select();
            if (error) { show({ type: 'error', message: `インポートエラー: ${error.message}` }); return; }
            setAreas(prev => [...prev, ...(data ?? [])]);
            show({ type: 'success', message: `${data?.length ?? 0}件をインポートしました。` });
        } catch { show({ type: 'error', message: 'CSVの読み込みに失敗しました。' }); }
        finally { setImporting(false); }
    };

    return (
        <div className="space-y-3">
            <CsvToolbar onExport={exportCsv} onImport={importCsv} importing={importing} onAdd={() => setForm({ name: '', description: '' })} status={status} />
            {loading ? (
                <p className="text-sm text-center text-muted-foreground py-6">読み込み中...</p>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {areas.length === 0 && !form && <p className="text-sm text-muted-foreground text-center py-8">データがありません</p>}
                    {areas.map(area => (
                        <div key={area.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                            {form?.id === area.id ? (
                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                    <Field value={form.name ?? ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="エリア名" required />
                                    <Field value={form.description ?? ''} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="説明" />
                                    <SaveCancel onSave={save} onCancel={() => setForm(null)} saving={saving} disabled={!form.name?.trim()} />
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{area.name}</p>
                                        {area.description && <p className="text-xs text-muted-foreground">{area.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => setForm(area)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                        <DeleteButton onDelete={() => remove(area.id)} />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {form && !form.id && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                <Field value={form.name ?? ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="エリア名" required />
                                <Field value={form.description ?? ''} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="説明" />
                            </div>
                            <SaveCancel onSave={save} onCancel={() => setForm(null)} saving={saving} disabled={!form.name?.trim()} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════
// 施設マスタ
// ════════════════════════════════════════════════════
function FacilitiesMaster({ tenantId }: { tenantId: string }) {
    const supabase = createClient();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading]       = useState(true);
    const [form, setForm]             = useState<Partial<Facility> | null>(null);
    const [saving, setSaving]         = useState(false);
    const [importing, setImporting]   = useState(false);
    const { status, show } = useStatus();

    useEffect(() => {
        supabase.from('settings_facilities').select('*').order('created_at').then(({ data }) => {
            setFacilities(data ?? []);
            setLoading(false);
        });
    }, []);

    const save = async () => {
        if (!form?.facility?.trim()) return;
        setSaving(true);
        try {
            const payload = {
                tenant_id:     tenantId,
                facility:      form.facility?.trim() ?? '',
                area:          form.area?.trim() ?? '',
                location_name: form.location_name?.trim() ?? '',
                address:       form.address?.trim() ?? '',
            };
            if (form.id) {
                const { data } = await supabase.from('settings_facilities').update(payload).eq('id', form.id).select().maybeSingle();
                if (data) setFacilities(prev => prev.map(f => f.id === data.id ? data : f));
            } else {
                const { data } = await supabase.from('settings_facilities').insert(payload).select().maybeSingle();
                if (data) setFacilities(prev => [...prev, data]);
            }
            setForm(null);
        } finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        await supabase.from('settings_facilities').delete().eq('id', id);
        setFacilities(prev => prev.filter(f => f.id !== id));
    };

    const exportCsv = () => {
        const rows = facilities.map(f => [f.facility, f.area, f.location_name, f.address].map(escapeCsv).join(','));
        downloadCsv(['facility,area,location_name,address', ...rows].join('\n'), '施設.csv');
    };

    const importCsv = async (file: File) => {
        setImporting(true);
        try {
            const text = await file.text();
            const records = parseCsv(text)
                .map(cols => ({ tenant_id: tenantId, facility: cols[0] ?? '', area: cols[1] ?? '', location_name: cols[2] ?? '', address: cols[3] ?? '' }))
                .filter(r => r.facility.trim());
            if (!records.length) { show({ type: 'error', message: '有効なデータが見つかりませんでした。ヘッダー行: facility,area,location_name,address' }); return; }
            const { data, error } = await supabase.from('settings_facilities').insert(records).select();
            if (error) { show({ type: 'error', message: `インポートエラー: ${error.message}` }); return; }
            setFacilities(prev => [...prev, ...(data ?? [])]);
            show({ type: 'success', message: `${data?.length ?? 0}件をインポートしました。` });
        } catch { show({ type: 'error', message: 'CSVの読み込みに失敗しました。' }); }
        finally { setImporting(false); }
    };

    const InlineForm = ({ f }: { f: Partial<Facility> }) => (
        <div className="flex flex-col gap-2 flex-1">
            <div className="flex flex-col sm:flex-row gap-2">
                <Field value={f.facility ?? ''} onChange={v => setForm(prev => ({ ...prev, facility: v }))} placeholder="施設名" required />
                <Field value={f.area ?? ''} onChange={v => setForm(prev => ({ ...prev, area: v }))} placeholder="エリア" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Field value={f.location_name ?? ''} onChange={v => setForm(prev => ({ ...prev, location_name: v }))} placeholder="場所名" />
                <Field value={f.address ?? ''} onChange={v => setForm(prev => ({ ...prev, address: v }))} placeholder="住所" />
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <CsvToolbar onExport={exportCsv} onImport={importCsv} importing={importing} onAdd={() => setForm({ facility: '', area: '', location_name: '', address: '' })} status={status} />
            {loading ? (
                <p className="text-sm text-center text-muted-foreground py-6">読み込み中...</p>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {facilities.length === 0 && !form && <p className="text-sm text-muted-foreground text-center py-8">データがありません</p>}
                    {facilities.map(fac => (
                        <div key={fac.id} className="px-4 py-3 bg-card">
                            {form?.id === fac.id ? (
                                <div className="flex gap-3 items-start">
                                    <InlineForm f={form} />
                                    <SaveCancel onSave={save} onCancel={() => setForm(null)} saving={saving} disabled={!form.facility?.trim()} />
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{fac.facility}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                            {fac.area && <p className="text-xs text-muted-foreground">{fac.area}</p>}
                                            {fac.location_name && <p className="text-xs text-muted-foreground">{fac.location_name}</p>}
                                            {fac.address && <p className="text-xs text-muted-foreground">{fac.address}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => setForm(fac)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                        <DeleteButton onDelete={() => remove(fac.id)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {form && !form.id && (
                        <div className="px-4 py-3 bg-muted/30">
                            <div className="flex gap-3 items-start">
                                <InlineForm f={form} />
                                <SaveCancel onSave={save} onCancel={() => setForm(null)} saving={saving} disabled={!form.facility?.trim()} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════
// 配送業者マスタ
// ════════════════════════════════════════════════════
function CouriersMaster({ tenantId }: { tenantId: string }) {
    const supabase = createClient();
    const [couriers, setCouriers]     = useState<Courier[]>([]);
    const [loading, setLoading]       = useState(true);
    const [form, setForm]             = useState<Partial<Courier> | null>(null);
    const [saving, setSaving]         = useState(false);
    const [importing, setImporting]   = useState(false);
    const { status, show } = useStatus();

    useEffect(() => {
        supabase.from('settings_couriers').select('*').order('created_at').then(({ data }) => {
            setCouriers(data ?? []);
            setLoading(false);
        });
    }, []);

    const save = async () => {
        if (!form?.name?.trim()) return;
        setSaving(true);
        try {
            const payload = { tenant_id: tenantId, name: form.name?.trim() ?? '', area: form.area?.trim() ?? '', url: form.url?.trim() ?? '' };
            if (form.id) {
                const { data } = await supabase.from('settings_couriers').update(payload).eq('id', form.id).select().maybeSingle();
                if (data) setCouriers(prev => prev.map(c => c.id === data.id ? data : c));
            } else {
                const { data } = await supabase.from('settings_couriers').insert(payload).select().maybeSingle();
                if (data) setCouriers(prev => [...prev, data]);
            }
            setForm(null);
        } finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        await supabase.from('settings_couriers').delete().eq('id', id);
        setCouriers(prev => prev.filter(c => c.id !== id));
    };

    const exportCsv = () => {
        const rows = couriers.map(c => [c.name, c.area, c.url].map(escapeCsv).join(','));
        downloadCsv(['name,area,url', ...rows].join('\n'), '配送業者.csv');
    };

    const importCsv = async (file: File) => {
        setImporting(true);
        try {
            const text = await file.text();
            const records = parseCsv(text)
                .map(cols => ({ tenant_id: tenantId, name: cols[0] ?? '', area: cols[1] ?? '', url: cols[2] ?? '' }))
                .filter(r => r.name.trim());
            if (!records.length) { show({ type: 'error', message: '有効なデータが見つかりませんでした。ヘッダー行: name,area,url' }); return; }
            const { data, error } = await supabase.from('settings_couriers').insert(records).select();
            if (error) { show({ type: 'error', message: `インポートエラー: ${error.message}` }); return; }
            setCouriers(prev => [...prev, ...(data ?? [])]);
            show({ type: 'success', message: `${data?.length ?? 0}件をインポートしました。` });
        } catch { show({ type: 'error', message: 'CSVの読み込みに失敗しました。' }); }
        finally { setImporting(false); }
    };

    return (
        <div className="space-y-3">
            <CsvToolbar onExport={exportCsv} onImport={importCsv} importing={importing} onAdd={() => setForm({ name: '', area: '', url: '' })} status={status} />
            {loading ? (
                <p className="text-sm text-center text-muted-foreground py-6">読み込み中...</p>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {couriers.length === 0 && !form && <p className="text-sm text-muted-foreground text-center py-8">データがありません</p>}
                    {couriers.map(courier => (
                        <div key={courier.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                            {form?.id === courier.id ? (
                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                    <Field value={form.name ?? ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="業者名" required />
                                    <Field value={form.area ?? ''} onChange={v => setForm(f => ({ ...f, area: v }))} placeholder="エリア" />
                                    <Field value={form.url ?? ''} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="URL" />
                                    <SaveCancel onSave={save} onCancel={() => setForm(null)} saving={saving} disabled={!form.name?.trim()} />
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{courier.name}</p>
                                        <div className="flex gap-3 flex-wrap mt-0.5">
                                            {courier.area && <p className="text-xs text-muted-foreground">{courier.area}</p>}
                                            {courier.url && (
                                                <a href={courier.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[200px]">{courier.url}</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => setForm(courier)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                        <DeleteButton onDelete={() => remove(courier.id)} />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {form && !form.id && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                <Field value={form.name ?? ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="業者名" required />
                                <Field value={form.area ?? ''} onChange={v => setForm(f => ({ ...f, area: v }))} placeholder="エリア" />
                                <Field value={form.url ?? ''} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="URL" />
                            </div>
                            <SaveCancel onSave={save} onCancel={() => setForm(null)} saving={saving} disabled={!form.name?.trim()} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════
// メインコンポーネント — tenant_id を一度だけ取得して各マスタに渡す
// ════════════════════════════════════════════════════
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'areas',      label: '配送エリア', icon: MapPin },
    { key: 'facilities', label: '施設',       icon: Building2 },
    { key: 'couriers',   label: '配送業者',   icon: Truck },
];

export default function SpecimenSettings() {
    const [tab, setTab]         = useState<Tab>('areas');
    const [tenantId, setTenantId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase
                .from('employees')
                .select('tenant_id')
                .eq('user_id', user.id)
                .maybeSingle()
                .then(({ data }) => setTenantId(data?.tenant_id ?? null));
        });
    }, []);

    return (
        <Card>
            <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold">検体管理設定</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">配送エリア・施設・配送業者のマスタデータを管理します。CSVでの一括インポート/エクスポートに対応しています。</p>

                <div className="flex gap-0.5 mt-4 border-b border-border">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                                tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="pt-5">
                {!tenantId ? (
                    <p className="text-sm text-center text-muted-foreground py-6">読み込み中...</p>
                ) : (
                    <>
                        {tab === 'areas'      && <DeliveryAreasMaster tenantId={tenantId} />}
                        {tab === 'facilities' && <FacilitiesMaster    tenantId={tenantId} />}
                        {tab === 'couriers'   && <CouriersMaster      tenantId={tenantId} />}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
