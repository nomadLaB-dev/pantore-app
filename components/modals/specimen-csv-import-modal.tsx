'use client';
import { useState } from 'react';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createSpecimen } from '@/lib/actions/specimen.actions';

interface Props {
    open: boolean;
    onClose: () => void;
    onImported?: () => void;
}

const CSV_COLUMNS = [
    'patient', 'type', 'collect_date', 'status', 'priority', 'clinic', 'doctor', 'notes', 'timeline',
] as const;

type CsvRow = { [K in typeof CSV_COLUMNS[number]]?: string } & { _error?: string };

function parseTimeline(raw?: string) {
    if (!raw) return null;
    return raw.split(';').filter(Boolean).map(part => {
        const match = part.match(/^(.*?)(?:\((.*)\))?$/);
        const step = (match?.[1] || part).trim();
        const time = match?.[2]?.trim() || null;
        return { step, done: Boolean(time), time };
    });
}

function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].replace(/^﻿/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: CsvRow = {};
        headers.forEach((h, i) => { (row as any)[h] = vals[i] ?? ''; });
        if (!row.patient || !row.type) row._error = 'patient / type が必須です';
        return row;
    });
}

export function SpecimenCsvImportModal({ open, onClose, onImported }: Props) {
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
        // IDは件数カウントに基づく連番採番のため、並列実行すると重複しうる
        for (const r of validRows) {
            await createSpecimen({
                patient: r.patient,
                type: r.type,
                date: r.collect_date || '',
                status: r.status || '受付済',
                priority: r.priority === 'true',
                clinic: r.clinic || '',
                doctor: r.doctor || '',
                notes: r.notes || '',
                timeline: parseTimeline(r.timeline),
            });
        }
        setImporting(false);
        setDone(true);
        onImported?.();
    };

    const handleClose = () => { setRows([]); setDone(false); onClose(); };

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>検体CSVインポート</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 font-mono break-all">
                        期待するヘッダー: {CSV_COLUMNS.join(', ')}（検体IDは自動採番されます）
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
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">患者名</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">種別</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">採取日</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">状態</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {rows.map((r, i) => (
                                            <tr key={i} className={r._error ? 'bg-red-50' : 'bg-white'}>
                                                <td className="px-3 py-2">{r.patient || '—'}</td>
                                                <td className="px-3 py-2">{r.type || '—'}</td>
                                                <td className="px-3 py-2">{r.collect_date || '—'}</td>
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
