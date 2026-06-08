'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, CheckCircle2, Users, Car, HomeIcon, CreditCard, ShieldCheck, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// helpers
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

type ExportCategory = 'employees' | 'vehicles' | 'real_estates' | 'subscriptions' | 'contracts';

const EXPORT_CATEGORIES: { id: ExportCategory; label: string; icon: React.ElementType }[] = [
    { id: 'employees', label: '社員', icon: Users },
    { id: 'vehicles', label: '車両', icon: Car },
    { id: 'real_estates', label: '不動産', icon: HomeIcon },
    { id: 'subscriptions', label: 'サブスク', icon: CreditCard },
    { id: 'contracts', label: '契約', icon: ShieldCheck },
];

export default function AssetExport() {
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    const [categories, setCategories] = useState<Record<ExportCategory, boolean>>({
        employees: true, vehicles: true, real_estates: true, subscriptions: true, contracts: true,
    });
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data: employees = [] } = useQuery<any[]>({ queryKey: ['employees'], queryFn: async () => fetch('/api/employees').then(res => res.json()).then(data => Array.isArray(data) ? data : []) });
    const { data: vehicles = [] } = useQuery<any[]>({ queryKey: ['vehicles'], queryFn: async () => fetch('/api/vehicles').then(res => res.json()).then(data => Array.isArray(data) ? data : []) });
    const { data: realEstates = [] } = useQuery<any[]>({ queryKey: ['real-estates'], queryFn: async () => fetch('/api/real-estates').then(res => res.json()).then(data => Array.isArray(data) ? data : []) });
    const { data: subscriptions = [] } = useQuery<any[]>({ queryKey: ['subscriptions'], queryFn: async () => fetch('/api/subscriptions').then(res => res.json()).then(data => Array.isArray(data) ? data : []) });
    const { data: contracts = [] } = useQuery<any[]>({ queryKey: ['contracts'], queryFn: async () => fetch('/api/contracts').then(res => res.json()).then(data => Array.isArray(data) ? data : []) });

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
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-brand-500" /> 資産データ エクスポート
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
    );
}
