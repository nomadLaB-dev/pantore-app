'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2, FileDown, Save, CheckCircle2, Users, Car,
    HomeIcon, CreditCard, ShieldCheck, Receipt, Calendar,
    Plus, Trash2, Edit2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── helpers ───────────────────────────────────────────────────────────────
function toCSV(rows: string[][]): string {
    return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(filename: string, content: string) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── types ─────────────────────────────────────────────────────────────────
type ExportCategory = 'employees' | 'vehicles' | 'real_estates' | 'subscriptions' | 'contracts';

const EXPORT_CATEGORIES: { id: ExportCategory; label: string; icon: React.ElementType }[] = [
    { id: 'employees', label: '社員', icon: Users },
    { id: 'vehicles', label: '車両', icon: Car },
    { id: 'real_estates', label: '不動産', icon: HomeIcon },
    { id: 'subscriptions', label: 'サブスク', icon: CreditCard },
    { id: 'contracts', label: '契約', icon: ShieldCheck },
];

// ── component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [savedTenant, setSavedTenant] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    const [tenant, setTenant] = useState({
        name: 'Pantore 株式会社',
        billingName: '山田 太郎',
        billingEmail: 'billing@pantore.test',
        billingAddress: '東京都渋谷区道玄坂1-1-1',
    });

    const [categories, setCategories] = useState<Record<ExportCategory, boolean>>({
        employees: true, vehicles: true, real_estates: true, subscriptions: true, contracts: true,
    });
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Fetch data for CSV
    const { data: employees = [] } = useQuery<any[]>({ queryKey: ['employees'], queryFn: async () => (await fetch('/api/employees')).json() });
    const { data: vehicles = [] } = useQuery<any[]>({ queryKey: ['vehicles'], queryFn: async () => (await fetch('/api/vehicles')).json() });
    const { data: realEstates = [] } = useQuery<any[]>({ queryKey: ['real-estates'], queryFn: async () => (await fetch('/api/real-estates')).json() });
    const { data: subscriptions = [] } = useQuery<any[]>({ queryKey: ['subscriptions'], queryFn: async () => (await fetch('/api/subscriptions')).json() });
    const { data: contracts = [] } = useQuery<any[]>({ queryKey: ['contracts'], queryFn: async () => (await fetch('/api/contracts')).json() });
    const { data: branches = [] } = useQuery<any[]>({ queryKey: ['branches'], queryFn: async () => (await fetch('/api/branches')).json() });

    const branchCreate = useMutation({ mutationFn: async (name: string) => fetch('/api/branches', { method: 'POST', body: JSON.stringify({ name }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }) });
    const branchUpdate = useMutation({ mutationFn: async (data: { id: string, name: string }) => fetch(`/api/branches/${data.id}`, { method: 'PUT', body: JSON.stringify({ name: data.name }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }) });
    const branchDelete = useMutation({ mutationFn: async (id: string) => fetch(`/api/branches/${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }) });

    const [newBranchName, setNewBranchName] = useState('');
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [editingBranchName, setEditingBranchName] = useState('');

    const toggleCategory = (id: ExportCategory) => setCategories((c) => ({ ...c, [id]: !c[id] }));

    const inRange = (dateStr: string) => {
        if (!dateStr) return true;
        const d = new Date(dateStr);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
    };

    const handleExport = async () => {
        setExporting(true);
        const zip: { name: string; csv: string }[] = [];

        if (categories.employees) {
            const rows = employees
                .filter((e) => inRange(e.hireDate))
                .map((e) => [e.name, e.email ?? '', e.branch?.name ?? '', e.hireDate ?? '', e.leaveDate ?? '', e.currentEmploymentCategory ?? '', e.accountStatus ?? '']);
            if (rows.length) zip.push({ name: '社員.csv', csv: toCSV([['氏名', 'メール', '支社', '入社日', '退職日', '雇用区分', 'アカウント'], ...rows]) });
        }
        if (categories.vehicles) {
            const rows = vehicles.map((v) => [v.manufacturer, v.model, v.licensePlate, v.licensePlateColor ?? '', v.ownershipType, v.branch?.name ?? '']);
            if (rows.length) zip.push({ name: '車両.csv', csv: toCSV([['メーカー', 'モデル', 'ナンバー', 'ナンバー色', '保有形態', '支社'], ...rows]) });
        }
        if (categories.real_estates) {
            const rows = realEstates.map((r) => [r.name, r.address, r.usageType ?? '', r.ownershipType ?? '', r.monthlyRent ?? '']);
            if (rows.length) zip.push({ name: '不動産.csv', csv: toCSV([['物件名', '住所', '用途', '保有形態', '月額賃料'], ...rows]) });
        }
        if (categories.subscriptions) {
            const rows = subscriptions.map((s) => [s.serviceName, s.corporateName, s.billingInterval, s.currentAmount ?? '', s.currentCurrency, s.branch?.name ?? '', s.assignee?.name ?? '']);
            if (rows.length) zip.push({ name: 'サブスク.csv', csv: toCSV([['サービス名', '法人名', '課金形態', '金額', '通貨', '支社', '担当'], ...rows]) });
        }
        if (categories.contracts) {
            const rows = contracts
                .filter((c) => inRange(c.endDate))
                .map((c) => [c.name, c.type, c.endDate ? new Date(c.endDate).toLocaleDateString('ja-JP') : '', c.daysLeft ?? '']);
            if (rows.length) zip.push({ name: '契約.csv', csv: toCSV([['名称', '種別', '終了日', '残日数'], ...rows]) });
        }

        // Download each CSV individually (no zip dependency needed)
        const dateLabel = dateFrom || dateTo ? `_${dateFrom || 'start'}_${dateTo || 'end'}` : '_全期間';
        zip.forEach(({ name, csv }) => {
            downloadCSV(`Pantore_${name.replace('.csv', '')}${dateLabel}.csv`, csv);
        });

        await new Promise((r) => setTimeout(r, 400));
        setExporting(false);
        setExportDone(true);
        setTimeout(() => setExportDone(false), 2500);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">設定</h1>
                <p className="text-muted-foreground text-sm">テナント情報・エクスポートなど管理者設定を行います。</p>
            </div>

            {/* ── Tenant settings ────────────────────────────────────────────── */}
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
                            onClick={() => { setSavedTenant(true); setTimeout(() => setSavedTenant(false), 2000); }}
                        >
                            {savedTenant ? <><CheckCircle2 className="w-4 h-4" /> 保存しました</> : <><Save className="w-4 h-4" /> 変更を保存</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Branch Management ────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-500" /> 支社・拠点管理
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="新しい支社名" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                        <Button className="bg-brand-500 hover:bg-brand-600 text-white shrink-0" disabled={!newBranchName || branchCreate.isPending} onClick={() => { branchCreate.mutate(newBranchName); setNewBranchName(''); }}>
                            <Plus className="w-4 h-4 mr-1.5" /> 追加
                        </Button>
                    </div>

                    <div className="border border-border rounded-xl divide-y divide-border">
                        {branches.map((b: any) => (
                            <div key={b.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                {editingBranchId === b.id ? (
                                    <div className="flex items-center gap-2 flex-1 mr-4">
                                        <Input autoFocus value={editingBranchName} onChange={(e) => setEditingBranchName(e.target.value)} />
                                        <Button size="sm" variant="outline" onClick={() => setEditingBranchId(null)}>キャンセル</Button>
                                        <Button size="sm" className="bg-brand-500 text-white" disabled={!editingBranchName} onClick={() => { branchUpdate.mutate({ id: b.id, name: editingBranchName }); setEditingBranchId(null); }}>保存</Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-sm">{b.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingBranchId(b.id); setEditingBranchName(b.name); }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600" onClick={() => { if (confirm(`${b.name}を削除してよろしいですか？`)) branchDelete.mutate(b.id); }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {branches.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">支社が登録されていません</p>}
                    </div>
                </CardContent>
            </Card>

            {/* ── CSV Export ─────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileDown className="w-4 h-4 text-brand-500" /> 資産データ エクスポート
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Date range */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> 期間選択（省略時: 全期間）
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">From</label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">To</label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                        </div>
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-brand-500 hover:text-brand-600 mt-1.5">
                                リセット（全期間）
                            </button>
                        )}
                    </div>

                    {/* Category checkboxes */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">出力対象</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {EXPORT_CATEGORIES.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => toggleCategory(id)}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                                        categories[id]
                                            ? 'bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-400'
                                            : 'bg-muted/40 border-border text-muted-foreground',
                                    )}
                                >
                                    <div className={cn(
                                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                                        categories[id] ? 'bg-brand-500 border-brand-500' : 'border-muted-foreground/40',
                                    )}>
                                        {categories[id] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path d="M2 6l3 3 5-5" /></svg>}
                                    </div>
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary info */}
                    <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-0.5">
                        <p>選択した資産ジャンルが個別のCSVファイルとしてダウンロードされます（UTF-8 BOM付き）。</p>
                        <p>Excel で開く際は文字コードが自動認識されます。</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {Object.values(categories).filter(Boolean).length} ジャンル選択中
                        </p>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white gap-2"
                            disabled={exporting || !Object.values(categories).some(Boolean)}
                            onClick={handleExport}
                        >
                            {exportDone ? (
                                <><CheckCircle2 className="w-4 h-4" /> ダウンロード完了</>
                            ) : exporting ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 出力中...</>
                            ) : (
                                <><FileDown className="w-4 h-4" /> CSVをダウンロード</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
