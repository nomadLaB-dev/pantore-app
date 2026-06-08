'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'

import { useState, useEffect } from 'react';
import { Users, Search, PlayCircle, Coffee, Square, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AttendanceStatus } from '@/types';

type DeliveryArea = { id: string; name: string };
type EmployeeData = { id: string; name: string; specimen_role: string | null; user_code: string | null; area?: string | null };
type RecordData = { status: AttendanceStatus; time: string | null; lastUpdated: string };

const STATUS_LABEL: Record<AttendanceStatus, string> = {
    not_started: '未出勤',
    working: '勤務中',
    on_break: '休憩中',
    finished: '退勤済',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
    not_started: 'bg-slate-100 text-slate-600 border-slate-200',
    working: 'bg-green-100 text-green-700 border-green-200',
    on_break: 'bg-amber-100 text-amber-700 border-amber-200',
    finished: 'bg-blue-100 text-blue-700 border-blue-200',
};

function StatusIcon({ status }: { status: AttendanceStatus }) {
    if (status === 'working') return <PlayCircle size={14} className="text-green-600" />;
    if (status === 'on_break') return <Coffee size={14} className="text-amber-600" />;
    if (status === 'finished') return <CheckCircle size={14} className="text-blue-600" />;
    return <Square size={14} className="text-slate-400" />;
}

export default function AttendancePage() {
    const supabase = createClient();
    const [mounted, setMounted] = useState(false);
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [employees, setEmployees] = useState<EmployeeData[]>([]);
    const [records, setRecords] = useState<Record<string, RecordData>>({});
    const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchRecords = async () => {
        const { data } = await supabase.from('attendance_records').select('employee_id, status, time, last_updated');
        if (data) {
            const map: Record<string, RecordData> = {};
            data.forEach((r: any) => {
                map[r.employee_id] = { status: r.status, time: r.time, lastUpdated: r.last_updated };
            });
            setRecords(map);
        }
    };

    useEffect(() => {
        setMounted(true);

        const fetchAreas = async () => {
            const { data } = await supabase.from('settings_delivery_areas').select('id, name').order('name');
            setAreas((data || []).map((d: any) => ({ id: d.id, name: d.name })));
        };

        const fetchEmployees = async () => {
            const { data } = await supabase
                .from('users')
                .select('id, name, specimen_role, user_code')
                .in('specimen_role', ['driver', 'base']);
            setEmployees((data || []).map((d: any) => ({
                id: d.id,
                name: d.name,
                specimen_role: d.specimen_role,
                user_code: d.user_code,
            })));
            await fetchRecords();
        };

        fetchAreas();
        fetchEmployees();

        const timer = setInterval(fetchRecords, 10000);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!mounted) return null;

    const filteredEmployees = employees.filter(emp => {
        const matchSearch = !searchQuery ||
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.user_code || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">出勤管理</h1>
                    <p className="text-sm text-muted-foreground mt-1">ドライバー・拠点スタッフの出勤状況</p>
                </div>
                <div className="text-sm text-slate-500">10秒ごとに自動更新</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="名前・ユーザーIDで検索..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedAreaId('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedAreaId === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        すべて
                    </button>
                    {areas.map(area => (
                        <button
                            key={area.id}
                            onClick={() => setSelectedAreaId(area.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedAreaId === area.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {area.name}
                        </button>
                    ))}
                </div>
            </div>

            {filteredEmployees.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">スタッフが見つかりません</p>
                    <p className="text-sm mt-1">ドライバー・拠点スタッフの登録が必要です。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.map(emp => {
                        const rec = records[emp.id];
                        const status: AttendanceStatus = rec?.status ?? 'not_started';
                        return (
                            <div key={emp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 subtle-hover">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">{emp.name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">ID: {emp.user_code ?? emp.id.slice(0, 8)}</p>
                                    </div>
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[status]}`}>
                                        <StatusIcon status={status} />
                                        {STATUS_LABEL[status]}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {rec?.time && <span>打刻時刻: {new Date(rec.time).toLocaleTimeString('ja-JP')}</span>}
                                    {rec?.lastUpdated && (
                                        <span className="ml-2 text-slate-400">
                                            更新: {new Date(rec.lastUpdated).toLocaleTimeString('ja-JP')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

AttendancePage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
