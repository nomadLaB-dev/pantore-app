'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Search, Settings2, ArrowLeft, GripVertical, Merge, Filter, X as XIcon, Save } from 'lucide-react';
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
    const [editingRow, setEditingRow] = useState<ScheduleRow | null>(null);
    const [editDraft, setEditDraft] = useState<ScheduleRow | null>(null);
    const [saving, setSaving] = useState(false);

    const toggleMerge = (key: string) => {
        setMergedColumns(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
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

    const openEdit = useCallback((row: ScheduleRow) => {
        setEditingRow(row);
        setEditDraft({ ...row });
    }, []);

    const closeEdit = useCallback(() => {
        setEditingRow(null);
        setEditDraft(null);
    }, []);

    const parseDbDate = (s: string | null | undefined): string | null => {
        if (!s) return null;
        const m = s.match(/(\d{4})[/\-](\d{2})[/\-](\d{2})/);
        return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
    };

    const handleSaveEdit = async () => {
        if (!editDraft || !editDraft.id) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('schedules').update({
                collect_date: parseDbDate(editDraft.collectDate),
                area: editDraft.area || '',
                collect_time: editDraft.collectTime || '',
                system_type: editDraft.systemType || '',
                uid: editDraft.uid || '',
                facility_name: editDraft.facilityName || '',
                delivery_type: editDraft.deliveryType || '',
                base: editDraft.base || '',
                facility_code: editDraft.facilityCode || '',
                visit_place: editDraft.visitPlace || '',
                trial_name: editDraft.trialName || '',
                request_date: parseDbDate(editDraft.requestDate),
                request_time: editDraft.requestTime || '',
                service: editDraft.service || '',
                con_no: editDraft.conNo || '',
                box_count: editDraft.boxCount ? Number(editDraft.boxCount) : null,
                request: editDraft.request || '',
                courier_code: editDraft.courierCode || '',
                courier_name: editDraft.courierName || '',
                reference: editDraft.reference || '',
                rev: editDraft.rev || '',
                note: editDraft.note || '',
            }).eq('id', editDraft.id);

            if (error) { alert(`保存に失敗しました。\n${error.message}`); return; }

            setRows(prev => prev.map(r => r.id === editDraft.id ? editDraft : r));
            closeEdit();
        } finally {
            setSaving(false);
        }
    };

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
        <>
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">集配送実績リスト</h1>
                    <p className="text-sm text-muted-foreground mt-1">過去の集配済みデータの一覧です。行をダブルクリックで編集できます。</p>
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
                        <p className="font-medium">実績データがありません</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    {displayCols.map(col => (
                                        <th key={col.key} draggable onDragStart={() => handleDragStart(col.key)} onDragOver={e => handleDragOver(e, col.key)} onDrop={() => handleDrop(col.key)} onDragEnd={handleDragEnd} className={`px-2 py-2 whitespace-nowrap border-r border-slate-100 last:border-r-0 select-none cursor-grab relative ${col.key === 'systemType' ? 'sticky left-0 bg-slate-50 z-20' : ''} ${dragOverKey === col.key ? 'bg-blue-50' : ''}`}>
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
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onDoubleClick={() => openEdit(row)}>
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

        {/* Edit modal */}
        {editDraft && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) closeEdit(); }}>
                <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">実績編集</h2>
                            <p className="text-xs text-slate-400 mt-0.5">UID: {editDraft.uid || '—'}</p>
                        </div>
                        <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <XIcon size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                        <section>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">基本情報</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {([
                                    { key: 'collectDate', label: '集配日', placeholder: 'YYYY/MM/DD' },
                                    { key: 'collectTime', label: '集配時間', placeholder: 'HH:MM - HH:MM' },
                                    { key: 'area', label: '集配エリア' },
                                    { key: 'uid', label: 'UID' },
                                    { key: 'deliveryType', label: '配送種別' },
                                ] as { key: keyof ScheduleRow; label: string; placeholder?: string }[]).map(({ key, label, placeholder }) => (
                                    <label key={key} className="flex flex-col gap-1">
                                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                                        <input
                                            type="text"
                                            value={(editDraft[key] as string) || ''}
                                            onChange={e => setEditDraft(d => d ? { ...d, [key]: e.target.value } : d)}
                                            placeholder={placeholder}
                                            className="px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                        />
                                    </label>
                                ))}
                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] font-semibold text-slate-500">システム種別</span>
                                    <select
                                        value={editDraft.systemType}
                                        onChange={e => setEditDraft(d => d ? ({ ...d, systemType: e.target.value } as ScheduleRow) : d)}
                                        className="px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                    >
                                        {Object.entries(SYSTEM_META).map(([v, m]) => (
                                            <option key={v} value={v}>{m.label}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </section>

                        <section>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">施設情報</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {([
                                    { key: 'facilityName', label: '集配施設名' },
                                    { key: 'facilityCode', label: '施設コード' },
                                    { key: 'base', label: '搬入拠点' },
                                    { key: 'visitPlace', label: '訪問場所' },
                                    { key: 'trialName', label: '治験名' },
                                ] as { key: keyof ScheduleRow; label: string }[]).map(({ key, label }) => (
                                    <label key={key} className="flex flex-col gap-1">
                                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                                        <input
                                            type="text"
                                            value={(editDraft[key] as string) || ''}
                                            onChange={e => setEditDraft(d => d ? { ...d, [key]: e.target.value } : d)}
                                            className="px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                        />
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">依頼情報</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {([
                                    { key: 'requestDate', label: '依頼受付日', placeholder: 'YYYY/MM/DD' },
                                    { key: 'requestTime', label: '依頼受付時間' },
                                    { key: 'service', label: 'サービス' },
                                    { key: 'conNo', label: 'Con No.' },
                                    { key: 'boxCount', label: '箱数' },
                                    { key: 'request', label: '依頼' },
                                ] as { key: keyof ScheduleRow; label: string; placeholder?: string }[]).map(({ key, label, placeholder }) => (
                                    <label key={key} className="flex flex-col gap-1">
                                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                                        <input
                                            type="text"
                                            value={(editDraft[key] as string) || ''}
                                            onChange={e => setEditDraft(d => d ? { ...d, [key]: e.target.value } : d)}
                                            placeholder={placeholder}
                                            className="px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                        />
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">業者情報</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {([
                                    { key: 'courierCode', label: '集材員コード' },
                                    { key: 'courierName', label: '集材員名' },
                                    { key: 'reference', label: 'リファレンス' },
                                    { key: 'rev', label: 'REV' },
                                ] as { key: keyof ScheduleRow; label: string }[]).map(({ key, label }) => (
                                    <label key={key} className="flex flex-col gap-1">
                                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                                        <input
                                            type="text"
                                            value={(editDraft[key] as string) || ''}
                                            onChange={e => setEditDraft(d => d ? { ...d, [key]: e.target.value } : d)}
                                            className="px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                        />
                                    </label>
                                ))}
                                <label className="flex flex-col gap-1 col-span-2 sm:col-span-3">
                                    <span className="text-[11px] font-semibold text-slate-500">備考</span>
                                    <textarea
                                        rows={2}
                                        value={editDraft.note || ''}
                                        onChange={e => setEditDraft(d => d ? { ...d, note: e.target.value } : d)}
                                        className="px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
                                    />
                                </label>
                            </div>
                        </section>
                    </div>

                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                        <button onClick={closeEdit} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
                            キャンセル
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
                        >
                            <Save size={14} />
                            {saving ? '保存中…' : '保存する'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

SchedulesArchivePage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
