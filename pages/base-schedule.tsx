'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';
import { useState, useEffect } from 'react';
import { MapPin, RefreshCw, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ScheduleRow } from '@/lib/formatSchedule';

function getWeekDates(baseDate: Date): Date[] {
    const day = baseDate.getDay();
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - ((day + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function toDateStr(d: Date): string {
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

export default function BaseSchedulePage() {
    const supabase = createClient();
    const [rows, setRows] = useState<ScheduleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseDate, setBaseDate] = useState(new Date());
    const weekDates = getWeekDates(baseDate);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('schedules')
                .select('*')
                .order('collect_date', { ascending: true });
            if (data) {
                setRows(data.map((d: any): ScheduleRow => ({
                    id: d.id,
                    collectDate: d.collect_date || '',
                    area: d.area || '',
                    systemType: d.system_type || '',
                    collectTime: d.collect_time || '',
                    uid: d.uid || '',
                    facilityName: d.facility_name || '',
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
                })));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const bases = Array.from(new Set(rows.map(r => r.base).filter(Boolean))).sort();

    const getRowsForBaseAndDate = (base: string, date: Date) => {
        const ds = toDateStr(date);
        return rows.filter(r => r.base === base && r.collectDate === ds);
    };

    const todayStr = toDateStr(new Date());

    return (
        <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden -m-5 md:-m-7">
            {/* Header */}
            <div className="flex flex-none items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">拠点スケジュール</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setBaseDate(new Date())}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                    >
                        今週
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
                            {weekDates[0].getMonth() + 1}月{weekDates[0].getDate()}日
                            〜
                            {weekDates[6].getMonth() + 1}月{weekDates[6].getDate()}日
                        </span>
                        <button
                            onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                        <RefreshCw size={18} className="animate-spin" /> 読み込み中...
                    </div>
                ) : bases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                        <CalendarDays size={40} className="text-slate-300" />
                        <p className="text-sm">拠点データがありません</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse text-sm min-w-[900px]">
                        <thead className="sticky top-0 z-10 bg-white shadow-sm">
                            <tr>
                                <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                                    拠点
                                </th>
                                {weekDates.map((date, i) => {
                                    const ds = toDateStr(date);
                                    const isToday = ds === todayStr;
                                    const isSat = i === 5;
                                    const isSun = i === 6;
                                    return (
                                        <th key={i} className={`border-b border-r border-slate-200 px-3 py-3 text-center text-xs font-semibold w-[12%] ${isToday ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                            <div className={`font-bold text-base ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-slate-700'}`}>
                                                {DAY_LABELS[i]}
                                            </div>
                                            <div className={`mt-0.5 ${isToday ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                                {date.getMonth() + 1}/{date.getDate()}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {bases.map((base, bi) => (
                                <tr key={base} className={bi % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="border-b border-r border-slate-200 px-4 py-3 font-semibold text-slate-700 text-xs align-top sticky left-0 bg-inherit">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={12} className="text-amber-500 shrink-0" />
                                            {base}
                                        </div>
                                    </td>
                                    {weekDates.map((date, di) => {
                                        const cellRows = getRowsForBaseAndDate(base, date);
                                        const isToday = toDateStr(date) === todayStr;
                                        return (
                                            <td key={di} className={`border-b border-r border-slate-200 px-2 py-2 align-top ${isToday ? 'bg-amber-50/40' : ''}`}>
                                                <div className="flex flex-col gap-1 min-h-[48px]">
                                                    {cellRows.map((r, ri) => (
                                                        <div
                                                            key={ri}
                                                            className="rounded-md px-2 py-1 text-[10px] leading-snug bg-amber-100 border border-amber-200 text-amber-900"
                                                        >
                                                            <div className="font-semibold truncate">{r.facilityName || r.uid}</div>
                                                            {r.collectTime && (
                                                                <div className="text-amber-700 mt-0.5 truncate">{r.collectTime}</div>
                                                            )}
                                                            {r.systemType && (
                                                                <span className="inline-block mt-0.5 px-1 rounded text-[9px] bg-amber-200 text-amber-800 font-medium">
                                                                    {r.systemType}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

BaseSchedulePage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
