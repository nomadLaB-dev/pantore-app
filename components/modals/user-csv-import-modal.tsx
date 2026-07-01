'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createEmployee } from '@/lib/actions/employee.actions';

interface Props {
    open: boolean;
    onClose: () => void;
    onImported?: () => void;
}

const CSV_COLUMNS = [
    'role', 'name', 'company', 'user_code', 'area', 'category', 'name_kana', 'birth_date', 'branch',
    'email', 'tel', 'address', 'emergency_contact', 'hire_date', 'hourly_rate', 'weekly_hours_min', 'weekly_hours_max',
] as const;

const VALID_ROLES = ['admin', 'staff', 'base', 'driver'];

// specimen_role も DB の ENUM (admin/staff/base/driver) のみ許容されるため変換する
const ROLE_MAP: Record<string, string> = {
    '管理者': 'admin',
    'スタッフ': 'staff',
    '拠点長': 'base',
    '拠点': 'base',
    'ドライバー': 'driver',
};

function toSpecimenRole(raw: string): string {
    if (VALID_ROLES.includes(raw)) return raw;
    return ROLE_MAP[raw] || raw;
}

// employment_category は DB の ENUM (full_time/part_time/contract/dispatch) のみ許容されるため変換する
const CATEGORY_MAP: Record<string, string> = {
    '正社員': 'full_time',
    'パート/アルバイト': 'part_time',
    'パート・アルバイト': 'part_time',
    '契約社員': 'contract',
    '委託会社': 'dispatch',
    '業務委託': 'dispatch',
};

function toEmploymentCategory(raw?: string): string {
    if (!raw) return 'full_time';
    if (['full_time', 'part_time', 'contract', 'dispatch'].includes(raw)) return raw;
    return CATEGORY_MAP[raw] || 'full_time';
}

type CsvRow = { [K in typeof CSV_COLUMNS[number]]?: string } & { _error?: string };

// company と一致する支社・拠点を探す。下請け企業など company 自体は未登録の場合、
// branch 列を「紐づけ先の登録済み支社（元請け）」の指定として使い、そちらで再検索する。
function resolveBranch(row: CsvRow, branches: any[]) {
    return branches.find(b => b.name === row.company) || branches.find(b => b.name === row.branch);
}

// 必須: role, name, company のみ。それ以外は空欄（null相当）を許容する。
function parseCsv(text: string, branches: any[]): CsvRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].replace(/^﻿/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: CsvRow = {};
        headers.forEach((h, i) => { (row as any)[h] = vals[i] ?? ''; });
        if (row.role) row.role = toSpecimenRole(row.role);
        if (!row.role || !row.name || !row.company) {
            row._error = 'role / name / company が必須です';
        } else if (!VALID_ROLES.includes(row.role)) {
            row._error = `権限ロールは ${VALID_ROLES.join('/')} のいずれかで指定してください`;
        } else if (!resolveBranch(row, branches)) {
            row._error = '支社・拠点が見つかりません（companyまたはbranch列で指定してください）';
        }
        return row;
    });
}

export function UserCsvImportModal({ open, onClose, onImported }: Props) {
    const [rows, setRows] = useState<CsvRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [done, setDone] = useState(false);

    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => (await fetch('/api/branches')).json(),
        enabled: open,
    });

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const text = ev.target?.result as string;
            setRows(parseCsv(text, branches));
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
        await Promise.all(validRows.map(r => {
            const branch = resolveBranch(r, branches);
            // email(UNIQUE NOT NULL)とhire_date(NOT NULL)はDB制約上必須のため、未入力時はプレースホルダーを補う
            const email = r.email || `imported-${crypto.randomUUID()}@placeholder.local`;
            const hireDate = r.hire_date || new Date().toISOString().slice(0, 10);
            return createEmployee({
                specimenRole: r.role,
                name: r.name,
                name_kana: r.name_kana || '',
                birthDate: r.birth_date || '',
                companyId: branch?.tenant_id || '',
                branchId: branch?.id || '',
                email,
                tel: r.tel || '',
                address: r.address || '',
                emergencyContact: r.emergency_contact || '',
                hireDate,
                category: toEmploymentCategory(r.category),
                hourlyRate: r.hourly_rate || '',
                weeklyHoursMin: r.weekly_hours_min || '0',
                weeklyHoursMax: r.weekly_hours_max || '0',
                userCode: r.user_code || '',
            });
        }));
        setImporting(false);
        setDone(true);
        onImported?.();
    };

    const handleClose = () => { setRows([]); setDone(false); onClose(); };

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>ユーザーCSVインポート</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 font-mono break-all">
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
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">権限ロール</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">氏名</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">メール</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">支社・拠点</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">状態</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {rows.map((r, i) => (
                                            <tr key={i} className={r._error ? 'bg-red-50' : 'bg-white'}>
                                                <td className="px-3 py-2">{r.role || '—'}</td>
                                                <td className="px-3 py-2">{r.name || '—'}</td>
                                                <td className="px-3 py-2">{r.email || '—'}</td>
                                                <td className="px-3 py-2">{r.company || '—'}</td>
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
