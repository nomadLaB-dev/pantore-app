'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Search, Settings2, GripVertical, Merge, Filter, X as XIcon, Save, FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import type { ScheduleRow } from '@/lib/formatSchedule';
import { createClient } from '@/lib/supabase/client';
import ScheduleTabs from '@/components/schedule-tabs';
import { useAppStore } from '@/store';

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
    const specimenRole = useAppStore((s) => s.specimenRole);
    const myBranchId = useAppStore((s) => s.branchId);
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
    const [filterDropdownPos, setFilterDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const [editingRow, setEditingRow] = useState<ScheduleRow | null>(null);
    const [editDraft, setEditDraft] = useState<ScheduleRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [availabilityRow, setAvailabilityRow] = useState<ScheduleRow | null>(null);
    const [savingAvailability, setSavingAvailability] = useState(false);

    const handlePdfUpload = async (file: File) => {
        if (!editDraft?.id) return;
        setUploadingPdf(true);
        try {
            const path = `${editDraft.id}/attachment.pdf`;
            const { error } = await supabase.storage
                .from('schedule-attachments')
                .upload(path, file, { upsert: true, contentType: 'application/pdf' });
            if (error) throw error;
            setEditDraft(d => d ? { ...d, attachmentPath: path, attachmentName: file.name } : d);
            await supabase.from('schedules').update({
                attachment_path: path,
                attachment_name: file.name,
            }).eq('id', editDraft.id);
        } catch (e: any) {
            alert(`アップロードに失敗しました。\n${e.message}`);
        } finally {
            setUploadingPdf(false);
        }
    };

    const handlePdfPreview = async () => {
        if (!editDraft?.attachmentPath) return;
        const { data } = await supabase.storage
            .from('schedule-attachments')
            .createSignedUrl(editDraft.attachmentPath, 60);
        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    };

    const handlePdfDelete = async () => {
        if (!editDraft?.attachmentPath || !editDraft?.id) return;
        if (!confirm('添付ファイルを削除しますか？')) return;
        await supabase.storage.from('schedule-attachments').remove([editDraft.attachmentPath]);
        await supabase.from('schedules').update({
            attachment_path: null,
            attachment_name: null,
        }).eq('id', editDraft.id);
        setEditDraft(d => d ? { ...d, attachmentPath: '', attachmentName: '' } : d);
        setRows(prev => prev.map(r => r.id === editDraft.id ? { ...r, attachmentPath: '', attachmentName: '' } : r));
    };

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
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) { setOpenFilterKey(null); setFilterDropdownPos(null); }
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

    const handleSetBranchAvailable = async (available: boolean) => {
        if (!availabilityRow) return;
        setSavingAvailability(true);
        try {
            const { error } = await supabase.from('schedules').update({ branch_available: available }).eq('id', availabilityRow.id);
            if (error) { alert(`保存に失敗しました。\n${error.message}`); return; }
            const updated = { ...availabilityRow, branchAvailable: available ? 'true' : 'false' };
            setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
            setAvailabilityRow(updated);
        } finally {
            setSavingAvailability(false);
        }
    };

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
                attachment_path: editDraft.attachmentPath || null,
                attachment_name: editDraft.attachmentName || null,
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
            const [schedulesRes, facilitiesRes, branchesRes] = await Promise.all([
                supabase.from('schedules').select('*').eq('is_archived', true),
                supabase.from('settings_facilities').select('facility, area'),
                specimenRole === 'base'
                    ? supabase.from('branches').select('delivery_areas').eq('id', myBranchId).maybeSingle()
                    : Promise.resolve({ data: null }),
            ]);
            const facilityAreaMap: Record<string, string> = {};
            for (const f of facilitiesRes.data || []) {
                if (f.facility && f.area) facilityAreaMap[f.facility] = f.area;
            }
            // 拠点長は自身の拠点・支社に対応するエリアのみ閲覧可能
            const allowedAreas: Set<string> | null = specimenRole === 'base'
                ? new Set((branchesRes as any)?.data?.delivery_areas || [])
                : null;
            const mapped = (schedulesRes.data || []).map((d: any) => {
                const facilityName = d.facility_name || '';
                return {
                    id: d.id,
                    collectDate: d.collect_date || '',
                    area: d.area || facilityAreaMap[facilityName] || '',
                    systemType: d.system_type || '',
                    collectTime: d.collect_time || '',
                    uid: d.uid || '',
                    facilityName,
                    deliveryType: d.delivery_type || '',
                    base: d.base || '',
                    facilityCode: d.facility_code || '',
                    visitPlace: d.visit_place || '',
                    trialName: d.trial_name || '',
                    requestDate: d.request_date || '',
                    requestTime: d.request_time || '',
                    service: d.service || '',
                    conNo: d.con_no || '',
                    boxCount: d.box_count?.toString() || '',
                    request: d.request || '',
                    courierCode: d.courier_code || '',
                    courierName: d.courier_name || '',
                    reference: d.reference || '',
                    rev: d.rev || '',
                    note: d.note || '',
                    pickupDone: d.pickup_done ? 'true' : '',
                    vehicleLoaded: d.vehicle_loaded ? 'true' : '',
                    unloaded: d.unloaded ? 'true' : '',
                    delivered: d.delivered ? 'true' : '',
                    attachmentPath: d.attachment_path || '',
                    attachmentName: d.attachment_name || '',
                    branchAvailable: d.branch_available === true ? 'true' : d.branch_available === false ? 'false' : '',
                };
            });
            setRows(allowedAreas ? mapped.filter((r) => r.area && allowedAreas.has(r.area)) : mapped);
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
            <ScheduleTabs />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">集配送実績リスト</h1>
                    <p className="text-sm text-muted-foreground mt-1">過去の集配済みデータの一覧です。行をダブルクリックで編集できます。</p>
                </div>
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
                                                <button onClick={e => { e.stopPropagation(); if (openFilterKey === col.key) { setOpenFilterKey(null); setFilterDropdownPos(null); return; } const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setFilterDropdownPos({ top: rect.bottom + 4, left: rect.left }); setOpenFilterKey(col.key); }} className={`flex-shrink-0 p-0.5 rounded ${hasFilter(col.key) ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}><Filter size={11} /></button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((row, rowIndex) => {
                                    const meta = SYSTEM_META[row.systemType] ?? { label: row.systemType, color: 'bg-slate-100 text-slate-600' };
                                    const isUnavailable = row.branchAvailable === 'false';
                                    return (
                                        <tr
                                            key={row.id}
                                            className={`transition-colors cursor-pointer ${isUnavailable ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-slate-50'}`}
                                            onDoubleClick={() => specimenRole === 'base' ? setAvailabilityRow(row) : openEdit(row)}
                                        >
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
                                                        <td key={col.key} rowSpan={rowSpan} className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top ${isUnavailable ? 'bg-red-100' : 'bg-white'} ${isSystemType ? 'sticky left-0 z-10' : ''}`}>
                                                            {isSystemType ? <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${meta.color}`}>{meta.label}</span> : <span className="text-slate-700 whitespace-pre-wrap font-bold">{val || ''}</span>}
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={col.key} className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top ${isSystemType ? `sticky left-0 z-10 ${isUnavailable ? 'bg-red-100' : 'bg-white/95'}` : ''}`}>
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

        {/* ── 拠点長向け：対応可否モーダル ──────────────────────────── */}
        {availabilityRow && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) setAvailabilityRow(null); }}>
                <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-800">集配スケジュール</h2>
                        <button onClick={() => setAvailabilityRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <XIcon size={18} />
                        </button>
                    </div>
                    <div className="px-6 py-5 space-y-3">
                        {([
                            { label: '集配日', value: availabilityRow.collectDate },
                            { label: '集配エリア', value: availabilityRow.area },
                            { label: '集配時間', value: availabilityRow.collectTime },
                            { label: '集配施設名', value: availabilityRow.facilityName },
                        ]).map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between gap-4">
                                <span className="text-xs font-semibold text-slate-500 shrink-0">{label}</span>
                                <span className="text-sm text-slate-800 text-right">{value || '—'}</span>
                            </div>
                        ))}

                        <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 mb-2">対応可否</p>
                            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => handleSetBranchAvailable(true)}
                                    disabled={savingAvailability}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${
                                        availabilityRow.branchAvailable === 'true' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    対応可
                                </button>
                                <button
                                    onClick={() => handleSetBranchAvailable(false)}
                                    disabled={savingAvailability}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors border-l border-slate-200 disabled:opacity-50 ${
                                        availabilityRow.branchAvailable === 'false' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    対応不可
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

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

                        {/* 添付ファイル */}
                        <section>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">添付ファイル</p>
                            <div className="space-y-2">
                                {editDraft.attachmentName ? (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                        <FileText size={15} className="text-red-500 flex-shrink-0" />
                                        <span className="text-xs text-slate-700 flex-1 truncate">{editDraft.attachmentName}</span>
                                        <button onClick={handlePdfPreview} className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors whitespace-nowrap">
                                            <ExternalLink size={11} /> プレビュー
                                        </button>
                                        <button onClick={handlePdfDelete} className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 size={11} /> 削除
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">添付ファイルなし</p>
                                )}
                                <label className={`inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${uploadingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Upload size={13} className="text-slate-500" />
                                    <span className="text-xs font-medium text-slate-600">
                                        {uploadingPdf ? 'アップロード中…' : editDraft.attachmentName ? 'PDFを差し替え' : 'PDFをアップロード'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        disabled={uploadingPdf}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ''; }}
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

        {/* Filter dropdown portal */}
        {mounted && openFilterKey && filterDropdownPos && (() => {
            const col = COLUMNS.find(c => c.key === openFilterKey);
            if (!col) return null;
            const uniqueVals = Array.from(new Set(rows.map(r => (r[col.key] as string) || ''))).sort((a, b) => a.localeCompare(b, 'ja'));
            return createPortal(
                <div
                    ref={filterDropdownRef}
                    style={{ position: 'fixed', top: filterDropdownPos.top, left: filterDropdownPos.left, zIndex: 9999 }}
                    className="min-w-[180px] max-w-[260px] bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-[11px]"
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
                        <span className="font-bold text-slate-600">{col.label}</span>
                        <div className="flex gap-1">
                            {hasFilter(col.key) && <button onClick={() => clearColumnFilter(col.key)} className="text-amber-500 text-[10px] font-medium">クリア</button>}
                            <button onClick={() => { setOpenFilterKey(null); setFilterDropdownPos(null); }} className="text-slate-400"><XIcon size={12} /></button>
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                        {uniqueVals.map(val => (
                            <label key={val || '__empty__'} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!columnFilters[col.key] || columnFilters[col.key].has(val)}
                                    onChange={() => {
                                        if (!columnFilters[col.key]) {
                                            setColumnFilters(prev => ({ ...prev, [col.key]: new Set(uniqueVals.filter(v => v !== val)) }));
                                        } else {
                                            toggleColumnFilter(col.key, val);
                                        }
                                    }}
                                    className="accent-blue-600"
                                />
                                <span className="text-slate-700 truncate">{val || '(空白)'}</span>
                            </label>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 px-3 py-1.5 flex gap-2">
                        <button onClick={() => clearColumnFilter(col.key)} className="text-[10px] text-blue-600 hover:underline">すべて選択</button>
                        <button onClick={() => setColumnFilters(prev => ({ ...prev, [col.key]: new Set() }))} className="text-[10px] text-slate-400 hover:underline">すべて解除</button>
                    </div>
                </div>,
                document.body
            );
        })()}
        </>
    );
}

SchedulesArchivePage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
