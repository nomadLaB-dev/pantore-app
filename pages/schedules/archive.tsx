'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, Search, Settings2, ArrowLeft, GripVertical, Merge, Filter, X as XIcon, ArchiveRestore } from 'lucide-react';
import type { ScheduleRow } from '@/lib/formatSchedule';
import { createClient } from '@/lib/supabase/client';

const COLUMNS: { key: keyof ScheduleRow; label: string }[] = [
    { key: 'collectDate',  label: '集配日' },
    { key: 'area',         label: '集配エリア' },
    { key: 'collectTime',  label: '集配時間' },
    { key: 'systemType',   label: 'システム種別' },
    { key: 'uid',          label: 'UID' },
    { key: 'facilityName', label: '集配施設名' },
    { key: 'deliveryType', label: '配送種別' },
    { key: 'base',         label: '搬入拠点' },
    { key: 'facilityCode', label: '集配施設コード' },
    { key: 'visitPlace',   label: '訪問場所' },
    { key: 'trialName',    label: '治験名' },
    { key: 'requestDate',  label: '依頼受付日' },
    { key: 'requestTime',  label: '依頼受付時間' },
    { key: 'service',      label: 'サービス' },
    { key: 'conNo',        label: 'Con No.' },
    { key: 'boxCount',     label: '箱数' },
    { key: 'request',      label: '依頼' },
    { key: 'courierCode',  label: '集材員コード' },
    { key: 'courierName',  label: '集材員名' },
    { key: 'reference',    label: 'リファレンス' },
    { key: 'rev',          label: 'REV' },
    { key: 'note',         label: '備考' },
];

const SYSTEM_META: Record<string, { label: string; color: string }> = {
    M:  { label: 'MDF',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
    Q:  { label: 'Q-dome', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    IP: { label: 'IPD',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    I:  { label: 'Inter',  color: 'bg-slate-100 text-slate-700 border-slate-200' },
    F:  { label: 'Fedex',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function SchedulesArchivePage() {
    const supabase = createClient();
    const [rows, setRows] = useState<ScheduleRow[]>([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
    const [showColumns, setShowColumns] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [columnsOrder, setColumnsOrder] = useState<string[]>(COLUMNS.map(c => c.key));
    const [mergedColumns, setMergedColumns] = useState<Set<string>>(new Set(['collectDate']));
    const dragColKey = useRef<string | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
    const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
    const filterDropdownRef = useRef<HTMLDivElement | null>(null);

    const toggleMerge = (key: string) => {
        setMergedColumns(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const handleUnarchive = async (id: string | undefined) => {
        if (!id || id.length < 10) return;
        if (!confirm('このデータを予定リストに戻しますか？')) return;
        const { error } = await supabase.from('schedules').update({ is_archived: false }).eq('id', id);
        if (error) { alert('データの復元に失敗しました。'); return; }
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const toggleColumnFilter = (colKey: string, value: string) => {
        setColumnFilters(prev => {
            const current = new Set(prev[colKey] || []);
            if (current.has(value)) current.delete(value); else current.add(value);
            return { ...prev, [colKey]: current };
        });
    };
    const clearColumnFilter = (colKey: string) => {
        setColumnFilters(prev => { const next = { ...prev }; delete next[colKey]; return next; });
    };
    const hasFilter = (colKey: string) => (columnFilters[colKey]?.size ?? 0) > 0;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) setOpenFilterKey(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDragStart = (key: string) => { dragColKey.current = key; };
    const handleDragOver = (e: React.DragEvent, key: string) => { e.preventDefault(); setDragOverKey(key); };
    const handleDrop = (targetKey: string) => {
        const from = dragColKey.current;
        if (!from || from === targetKey) { setDragOverKey(null); return; }
        setColumnsOrder(prev => {
            const arr = [...prev];
            const fi = arr.indexOf(from); const ti = arr.indexOf(targetKey);
            if (fi === -1 || ti === -1) return prev;
            arr.splice(fi, 1); arr.splice(ti, 0, from);
            return arr;
        });
        dragColKey.current = null; setDragOverKey(null);
    };
    const handleDragEnd = () => { dragColKey.current = null; setDragOverKey(null); };

    const displayCols = columnsOrder
        .map(k => COLUMNS.find(c => c.key === k))
        .filter((c): c is typeof COLUMNS[0] => !!c && visibleColumns.includes(c.key));

    const load = async () => {
        try {
            const { data } = await supabase.from('schedules').select('*').eq('is_archived', true);
            setRows((data || []).map((d: any) => ({
                id: d.id, collectDate: d.collect_date || '', area: d.area || '',
                systemType: d.system_type || '', collectTime: d.collect_time || '',
                uid: d.uid || '', facilityName: d.facility_name || '',
                deliveryType: d.delivery_type || '', base: d.base || '',
                facilityCode: d.facility_code || '', visitPlace: d.visit_place || '',
                trialName: d.trial_name || '', requestDate: d.request_date || '',
                requestTime: d.request_time || '', service: d.service || '',
                conNo: d.con_no || '', boxCount: d.box_count?.toString() || '',
                request: d.request || '', courierCode: d.courier_code || '',
                courierName: d.courier_name || '', reference: d.reference || '',
                rev: d.rev || '', note: d.note || '',
            })));
        } catch { setRows([]); }
    };

    useEffect(() => { setMounted(true); load(); }, []); // eslint-disable-line

    if (!mounted) return null;

    const filtered = rows.filter(r => {
        if (filterType !== 'all' && r.systemType !== filterType) return false;
        for (const [colKey, allowed] of Object.entries(columnFilters)) {
            if (allowed.size === 0) continue;
            if (!allowed.has((r[colKey as keyof ScheduleRow] || '') as string)) return false;
        }
        if (!search) return true;
        const q = search.toLowerCase();
        return COLUMNS.some(col => { const val = r[col.key]; return typeof val === 'string' && val.toLowerCase().includes(q); });
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        アーカイブ
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">過去の集配済みデータの一覧です。</p>
                </div>
                <Link href="/schedules" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm">
                    <ArrowLeft size={15} /> 予定リストへ戻る
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="検索..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {(['all', 'M', 'Q', 'IP', 'I', 'F'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                {t === 'all' ? 'すべて' : (SYSTEM_META[t]?.label ?? t)}
                            </button>
                        ))}
                        <button onClick={() => setShowColumns(!showColumns)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${showColumns ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            <Settings2 size={14} /> 表示設定
                        </button>
                    </div>
                </div>
                {showColumns && (
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2">
                            {COLUMNS.map(col => {
                                const isVisible = visibleColumns.includes(col.key);
                                return (
                                    <label key={col.key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${isVisible ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                        <input type="checkbox" checked={isVisible} onChange={e => { if (e.target.checked) setVisibleColumns(prev => [...prev, col.key]); else setVisibleColumns(prev => prev.filter(k => k !== col.key)); }} className="hidden" />
                                        <span className={isVisible ? 'font-medium' : ''}>{col.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">アーカイブデータがありません</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 whitespace-nowrap border-r border-slate-100">操作</th>
                                    {displayCols.map(col => (
                                        <th key={col.key} draggable onDragStart={() => handleDragStart(col.key)} onDragOver={e => handleDragOver(e, col.key)} onDrop={() => handleDrop(col.key)} onDragEnd={handleDragEnd} className={`px-2 py-2 whitespace-nowrap border-r border-slate-100 last:border-r-0 select-none cursor-grab ${col.key === 'systemType' ? 'sticky left-0 bg-slate-50 z-20' : ''} ${dragOverKey === col.key ? 'bg-blue-50' : ''}`}>
                                            <div className="flex items-center gap-1">
                                                <GripVertical size={12} className="text-slate-400 flex-shrink-0" />
                                                <span className="flex-1">{col.label}</span>
                                                <button onClick={e => { e.stopPropagation(); toggleMerge(col.key); }} className={`flex-shrink-0 p-0.5 rounded ${mergedColumns.has(col.key) ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}><Merge size={11} /></button>
                                                <button onClick={e => { e.stopPropagation(); setOpenFilterKey(openFilterKey === col.key ? null : col.key); }} className={`flex-shrink-0 p-0.5 rounded ${hasFilter(col.key) ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}><Filter size={11} /></button>
                                            </div>
                                            {openFilterKey === col.key && (
                                                <div ref={filterDropdownRef} className="absolute top-full left-0 z-50 mt-1 min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-[11px]" onMouseDown={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
                                                        <span className="font-bold text-slate-600">{col.label}</span>
                                                        <button onClick={() => setOpenFilterKey(null)} className="text-slate-400"><XIcon size={12} /></button>
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto py-1">
                                                        {Array.from(new Set(rows.map(r => (r[col.key] as string) || ''))).sort().map(val => (
                                                            <label key={val || '__empty__'} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-50 cursor-pointer">
                                                                <input type="checkbox" checked={!columnFilters[col.key] || columnFilters[col.key].has(val)} onChange={() => { if (!columnFilters[col.key]) { setColumnFilters(prev => ({ ...prev, [col.key]: new Set(rows.map(r => (r[col.key] as string) || '').filter(v => v !== val)) })); } else toggleColumnFilter(col.key, val); }} className="accent-blue-600" />
                                                                <span className="text-slate-700 truncate">{val || '(空白)'}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="border-t border-slate-100 px-3 py-1.5 flex gap-2">
                                                        <button onClick={() => clearColumnFilter(col.key)} className="text-[10px] text-blue-600 hover:underline">すべて選択</button>
                                                    </div>
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((row, rowIndex) => {
                                    const meta = SYSTEM_META[row.systemType] ?? { label: row.systemType, color: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-2.5 border-r border-slate-100">
                                                <button onClick={() => handleUnarchive(row.id)} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold hover:bg-emerald-100 transition-colors whitespace-nowrap">
                                                    <ArchiveRestore size={11} /> 復元
                                                </button>
                                            </td>
                                            {displayCols.map(col => {
                                                const val = row[col.key] as string;
                                                const isSystemType = col.key === 'systemType';
                                                if (mergedColumns.has(col.key)) {
                                                    const leftMergedCols = displayCols.slice(0, displayCols.findIndex(c => c.key === col.key)).filter(c => mergedColumns.has(c.key));
                                                    const isSameGroup = (ti: number) => leftMergedCols.every(lc => (filtered[ti][lc.key] as string) === (filtered[rowIndex][lc.key] as string));
                                                    const prevSameGroup = rowIndex > 0 && isSameGroup(rowIndex - 1);
                                                    const prevVal = rowIndex > 0 ? filtered[rowIndex - 1][col.key] as string : null;
                                                    if (val && val === prevVal && prevSameGroup) return null;
                                                    let rowSpan = 1;
                                                    if (val) { let i = rowIndex + 1; while (i < filtered.length && (filtered[i][col.key] as string) === val && isSameGroup(i)) { rowSpan++; i++; } }
                                                    return (
                                                        <td key={col.key} rowSpan={rowSpan} className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top bg-white ${isSystemType ? 'sticky left-0 z-10' : ''}`}>
                                                            {isSystemType ? <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${meta.color}`}>{meta.label}</span> : <span className="text-slate-700 whitespace-pre-wrap font-bold">{val || ''}</span>}
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={col.key} className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top ${isSystemType ? 'sticky left-0 bg-white/95 z-10' : ''}`}>
                                                        {isSystemType ? <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${meta.color}`}>{meta.label}</span> : <span className="text-slate-700 whitespace-pre-wrap">{val || ''}</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

SchedulesArchivePage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
