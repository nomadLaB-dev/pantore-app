'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Coffee, LogOut, CheckCircle2 } from 'lucide-react';

type AttendanceStatus = 'not_started' | 'working' | 'on_break' | 'finished';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
    not_started: '未出勤',
    working: '勤務中',
    on_break: '休憩中',
    finished: '退勤済',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
    not_started: 'bg-slate-100 text-slate-600',
    working: 'bg-emerald-100 text-emerald-700',
    on_break: 'bg-amber-100 text-amber-700',
    finished: 'bg-blue-100 text-blue-700',
};

function formatElapsed(from: string | null): string {
    if (!from) return '';
    const diff = Math.floor((Date.now() - new Date(from).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (h > 0) return `${h}時間${m}分経過`;
    return `${m}分経過`;
}

export default function TimecardPage() {
    const supabase = createClient();
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [status, setStatus] = useState<AttendanceStatus>('not_started');
    const [statusTime, setStatusTime] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [now, setNow] = useState(new Date());

    // 現在時刻を1秒ごとに更新
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
            setElapsed(formatElapsed(statusTime));
        }, 1000);
        return () => clearInterval(timer);
    }, [statusTime]);

    const load = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: emp } = await supabase
            .from('users')
            .select('id, tenant_id')
            .eq('user_id', user.id)
            .single();
        if (!emp) return;

        setEmployeeId(emp.id);
        setTenantId(emp.tenant_id);

        const { data: record } = await supabase
            .from('attendance_records')
            .select('status, time')
            .eq('employee_id', emp.id)
            .maybeSingle();

        if (record) {
            setStatus(record.status as AttendanceStatus);
            setStatusTime(record.time);
            setElapsed(formatElapsed(record.time));
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (next: AttendanceStatus) => {
        if (!employeeId || !tenantId || saving) return;
        setSaving(true);
        const time = new Date().toISOString();
        // 現在のstatusを参照してイベント種別を決定
        const eventType: Record<string, string> = {
            working: status === 'not_started' ? 'clock_in' : 'break_end',
            on_break: 'break_start',
            finished: 'clock_out',
        };
        const [upsertRes] = await Promise.all([
            supabase.from('attendance_records').upsert(
                { tenant_id: tenantId, employee_id: employeeId, status: next, time, last_updated: time },
                { onConflict: 'tenant_id,employee_id' }
            ),
            eventType[next]
                ? supabase.from('attendance_logs').insert({ tenant_id: tenantId, employee_id: employeeId, event_type: eventType[next], time })
                : Promise.resolve({ error: null }),
        ]);
        if (!upsertRes.error) {
            setStatus(next);
            setStatusTime(time);
            setElapsed(formatElapsed(time));
        } else {
            alert('更新に失敗しました');
        }
        setSaving(false);
    };

    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-sm mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">タイムカード</h1>

            {/* 時計 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <p className="text-xs text-slate-400 mb-1">{dateStr}</p>
                <p className="text-5xl font-mono font-bold text-slate-800 tracking-tight">{timeStr}</p>
            </div>

            {/* 現在ステータス */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-400 mb-1">現在のステータス</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLOR[status]}`}>
                        {STATUS_LABEL[status]}
                    </span>
                    {elapsed && status !== 'not_started' && (
                        <p className="text-xs text-slate-400 mt-1">{elapsed}</p>
                    )}
                </div>
                {status === 'finished' && (
                    <CheckCircle2 className="w-8 h-8 text-blue-400" />
                )}
            </div>

            {/* アクションボタン */}
            <div className="space-y-3">
                {status === 'not_started' && (
                    <button
                        onClick={() => updateStatus('working')}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-lg font-bold shadow-md transition-colors"
                    >
                        <LogIn className="w-5 h-5" /> 出勤する
                    </button>
                )}
                {status === 'working' && (
                    <>
                        <button
                            onClick={() => updateStatus('on_break')}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-lg font-bold shadow-md transition-colors"
                        >
                            <Coffee className="w-5 h-5" /> 休憩する
                        </button>
                        <button
                            onClick={() => updateStatus('finished')}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white text-lg font-bold shadow-md transition-colors"
                        >
                            <LogOut className="w-5 h-5" /> 退勤する
                        </button>
                    </>
                )}
                {status === 'on_break' && (
                    <button
                        onClick={() => updateStatus('working')}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-lg font-bold shadow-md transition-colors"
                    >
                        <LogIn className="w-5 h-5" /> 休憩終わり
                    </button>
                )}
                {status === 'finished' && (
                    <div className="text-center py-4 text-slate-400 text-sm font-medium">
                        お疲れ様でした。本日の業務は終了です。
                    </div>
                )}
            </div>
        </div>
    );
}

TimecardPage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
