'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';
import { useState, useEffect, useRef } from 'react';
import { MapPin, RefreshCw, Calendar, Search, Settings2, GripVertical, Merge, Filter, X as XIcon, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ScheduleRow } from '@/lib/formatSchedule';

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

function normalizeScheduleRow(d: any, facilityAreaMap: Record<string, string>): ScheduleRow {
    const facilityName = d.facility_name || '';
    const area = d.area || facilityAreaMap[facilityName] || '';

    let normalizedDate = d.collect_date || '';
    const dateMatch = normalizedDate.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dateMatch) {
        normalizedDate = `${dateMatch[1]}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3].padStart(2, '0')}`;
    }

    let normalizedTime = d.collect_time || '';
    if (normalizedTime) {
        normalizedTime = normalizedTime.replace(/[０-９：]/g, (s: string) =>
            String.fromCharCode(s.charCodeAt(0) - 0xFEE0),
        );
        const timeMatches = [...normalizedTime.matchAll(/\b(\d{1,2}):?(\d{2})\b/g)];
        if (timeMatches.length === 1) {
            const t = `${timeMatches[0][1].padStart(2, '0')}:${timeMatches[0][2]}`;
            normalizedTime = `${t} - ${t}`;
        } else if (timeMatches.length >= 2) {
            const t1 = `${timeMatches[0][1].padStart(2, '0')}:${timeMatches[0][2]}`;
            const t2 = `${timeMatches[1][1].padStart(2, '0')}:${timeMatches[1][2]}`;
            normalizedTime = `${t1} - ${t2}`;
        }
    }

    return {
        id: d.id,
        collectDate: normalizedDate,
        area,
        systemType: d.system_type || '',
        collectTime: normalizedTime,
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
    };
}

export default function AreaSchedulePage() {
    const supabase = createClient();
    const [rows, setRows] = useState<ScheduleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key).filter(k => k !== 'area'));
    const [showColumns, setShowColumns] = useState(false);
    const [columnsOrder, setColumnsOrder] = useState<string[]>(COLUMNS.map(c => c.key));
    const [mergedColumns, setMergedColumns] = useState<Set<string>>(new Set(['collectDate', 'collectTime', 'systemType']));
    const dragColKey = useRef<string | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
    const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
    const filterDropdownRef = useRef<HTMLDivElement | null>(null);
    const [sortKey, setSortKey] = useState<keyof ScheduleRow | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const load = async () => {
        setLoading(true);
        try {
            const [schedulesRes, facilitiesRes] = await Promise.all([
                supabase.from('schedules').select('*').eq('is_archived', false),
                supabase.from('settings_facilities').select('facility, area'),
            ]);
            if (schedulesRes.data && !schedulesRes.error) {
                const facilityAreaMap: Record<string, string> = {};
                for (const f of facilitiesRes.data || []) {
                    if (f.facility && f.area) facilityAreaMap[f.facility] = f.area;
                }
                setRows(schedulesRes.data.map((d: any) => normalizeScheduleRow(d, facilityAreaMap)));
            } else {
                setRows([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
                setOpenFilterKey(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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

    const handleSortClick = (key: keyof ScheduleRow) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const displayCols = columnsOrder
        .map(k => COLUMNS.find(c => c.key === k))
        .filter((c): c is typeof COLUMNS[0] => !!c && visibleColumns.includes(c.key));

    const areas = Array.from(new Set(rows.map(r => r.area).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ja'));

    useEffect(() => {
        if (areas.length > 0 && !selectedArea) setSelectedArea(areas[0]);
    }, [areas.join(',')]); // eslint-disable-line

    const areaFiltered = rows.filter(r => r.area === selectedArea);

    const filtered = areaFiltered
        .filter(r => {
            if (filterType !== 'all' && r.systemType !== filterType) return false;
            for (const [colKey, allowed] of Object.entries(columnFilters)) {
                if (allowed.size === 0) continue;
                if (!allowed.has((r[colKey as keyof ScheduleRow] || '') as string)) return false;
            }
            if (!search) return true;
            const q = search.toLowerCase();
            return COLUMNS.some(col => {
                const val = r[col.key];
                return typeof val === 'string' && val.toLowerCase().includes(q);
            });
        })
        .sort((a, b) => {
            if (sortKey) {
                const va = (a[sortKey] as string) || '';
                const vb = (b[sortKey] as string) || '';
                if (va !== vb) {
                    const cmp = va.localeCompare(vb, 'ja');
                    return sortDir === 'asc' ? cmp : -cmp;
                }
            }
            const d = a.collectDate.localeCompare(b.collectDate);
            if (d !== 0) return d;
            return a.collectTime.localeCompare(b.collectTime);
        });

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">エリアスケジュール</h1>
                    <p className="text-sm text-muted-foreground mt-1">エリア別の集配スケジュール一覧です。</p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> 最新を表示
                </button>
            </div>

            {/* Area tabs */}
            <div className="flex items-end gap-0 border-b border-slate-200 overflow-x-auto">
                {areas.map(area => {
                    const count = rows.filter(r => r.area === area).length;
                    return (
                        <button
                            key={area}
                            onClick={() => setSelectedArea(area)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
                                selectedArea === area
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <MapPin size={13} />
                            {area}
                            <span className={`text-xs font-normal ${selectedArea === area ? 'text-blue-400' : 'text-slate-400'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search / filter bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="施設名・リファレンス・UID 等で検索..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {(['all', 'M', 'Q', 'IP', 'I', 'F'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    filterType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {t === 'all' ? 'すべて' : (SYSTEM_META[t]?.label ?? t)}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowColumns(!showColumns)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                showColumns ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <Settings2 size={14} /> 表示設定
                        </button>
                    </div>
                </div>

                {showColumns && (
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-500">表示する項目</span>
                            <div className="flex gap-3">
                                <button onClick={() => setVisibleColumns(COLUMNS.map(c => c.key))} className="text-[11px] text-blue-600 hover:underline font-medium">すべて選択</button>
                                <button onClick={() => setVisibleColumns(['systemType', 'collectDate', 'area', 'facilityName', 'uid', 'collectTime'])} className="text-[11px] text-slate-500 hover:underline">基本項目のみ</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {COLUMNS.map(col => {
                                const isVisible = visibleColumns.includes(col.key);
                                return (
                                    <label
                                        key={col.key}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                            isVisible ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isVisible}
                                            onChange={e => {
                                                if (e.target.checked) setVisibleColumns(prev => [...prev, col.key]);
                                                else setVisibleColumns(prev => prev.filter(k => k !== col.key));
                                            }}
                                            className="hidden"
                                        />
                                        <span className={isVisible ? 'font-medium' : ''}>{col.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Count badges */}
            {areaFiltered.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(SYSTEM_META).map(([type, meta]) => {
                        const count = areaFiltered.filter(r => r.systemType === type).length;
                        if (count === 0) return null;
                        return (
                            <span key={type} className={`px-3 py-1 rounded-md text-xs font-bold border ${meta.color}`}>
                                {meta.label}: {count}件
                            </span>
                        );
                    })}
                    <span className="text-xs text-slate-400 ml-1">合計 {areaFiltered.length} 件 / 表示 {filtered.length} 件</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin" /> 読み込み中...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">データがありません</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    {displayCols.map(col => {
                                        const uniqueVals = Array.from(new Set(areaFiltered.map(r => (r[col.key] as string) || ''))).sort((a, b) => a.localeCompare(b, 'ja'));
                                        const isSorted = sortKey === col.key;
                                        return (
                                            <th
                                                key={col.key}
                                                draggable
                                                onDragStart={() => handleDragStart(col.key)}
                                                onDragOver={e => handleDragOver(e, col.key)}
                                                onDrop={() => handleDrop(col.key)}
                                                onDragEnd={handleDragEnd}
                                                className={`px-2 py-2 whitespace-nowrap border-r border-slate-100 last:border-r-0 select-none relative ${
                                                    col.key === 'systemType' ? 'sticky left-0 bg-slate-50 z-20' : ''
                                                } ${dragOverKey === col.key ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <GripVertical size={12} className="text-slate-400 cursor-grab flex-shrink-0" />
                                                    <button
                                                        onClick={() => handleSortClick(col.key)}
                                                        className="flex items-center gap-0.5 flex-1 hover:text-slate-800 transition-colors text-left"
                                                    >
                                                        <span>{col.label}</span>
                                                        {isSorted ? (
                                                            sortDir === 'asc'
                                                                ? <ChevronUp size={11} className="text-blue-600 flex-shrink-0" />
                                                                : <ChevronDown size={11} className="text-blue-600 flex-shrink-0" />
                                                        ) : (
                                                            <ChevronsUpDown size={11} className="text-slate-300 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); toggleMerge(col.key); }}
                                                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${mergedColumns.has(col.key) ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                                                    >
                                                        <Merge size={11} />
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setOpenFilterKey(openFilterKey === col.key ? null : col.key); }}
                                                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${hasFilter(col.key) ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                                                    >
                                                        <Filter size={11} />
                                                    </button>
                                                </div>
                                                {openFilterKey === col.key && (
                                                    <div ref={filterDropdownRef} className="absolute top-full left-0 z-50 mt-1 min-w-[180px] max-w-[260px] bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-[11px]" onMouseDown={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
                                                            <span className="font-bold text-slate-600">{col.label}</span>
                                                            <div className="flex gap-1">
                                                                {hasFilter(col.key) && <button onClick={() => clearColumnFilter(col.key)} className="text-amber-500 text-[10px] font-medium">クリア</button>}
                                                                <button onClick={() => setOpenFilterKey(null)} className="text-slate-400"><XIcon size={12} /></button>
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
                                                    </div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((row, rowIndex) => {
                                    const meta = SYSTEM_META[row.systemType] ?? { label: row.systemType, color: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            {displayCols.map(col => {
                                                const val = row[col.key] as string;
                                                const isSystemType = col.key === 'systemType';

                                                if (mergedColumns.has(col.key)) {
                                                    const colIdx = displayCols.findIndex(c => c.key === col.key);
                                                    const leftMergedCols = displayCols.slice(0, colIdx).filter(c => mergedColumns.has(c.key));
                                                    const isSameGroup = (ti: number) =>
                                                        leftMergedCols.every(lc => (filtered[ti][lc.key] as string) === (filtered[rowIndex][lc.key] as string));
                                                    const prevSameGroup = rowIndex > 0 && isSameGroup(rowIndex - 1);
                                                    const prevVal = rowIndex > 0 ? filtered[rowIndex - 1][col.key] as string : null;
                                                    if (val && val === prevVal && prevSameGroup) return null;
                                                    let rowSpan = 1;
                                                    if (val) {
                                                        let i = rowIndex + 1;
                                                        while (i < filtered.length && (filtered[i][col.key] as string) === val && isSameGroup(i)) { rowSpan++; i++; }
                                                    }
                                                    return (
                                                        <td key={col.key} rowSpan={rowSpan} className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top bg-white ${rowSpan > 1 ? 'border-b border-slate-200' : ''} ${isSystemType ? 'sticky left-0 z-10' : ''}`}>
                                                            {isSystemType
                                                                ? <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
                                                                : <span className="text-slate-700 whitespace-pre-wrap font-bold">{val || ''}</span>
                                                            }
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={col.key} className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top ${isSystemType ? 'sticky left-0 bg-white/95 z-10' : ''}`}>
                                                        {isSystemType
                                                            ? <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
                                                            : <span className="text-slate-700 whitespace-pre-wrap">{val || ''}</span>
                                                        }
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

AreaSchedulePage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
