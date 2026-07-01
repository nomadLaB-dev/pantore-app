'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'

import { useState, useEffect, useRef } from 'react';
import { Users, Search, PlayCircle, Coffee, Square, CheckCircle, Building2, AlertTriangle, Trash2 } from 'lucide-react';

const RESET_SEQUENCE = ['R', 'E', 'S', 'E', 'T'];
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/types';

type Branch = { id: string; name: string };
type EmployeeData = { id: string; name: string; specimen_role: 'driver' | 'base'; user_code: string | null; branch_id: string | null };
type RecordData = { status: AttendanceStatus; time: string | null };
type LogEntry = { employee_id: string; event_type: string; time: string };

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

const ROLE_LABEL: Record<'driver' | 'base', string> = { base: '拠点長', driver: 'ドライバー' };
const ROLE_COLOR: Record<'driver' | 'base', string> = {
    base: 'bg-violet-50 text-violet-700 border-violet-200',
    driver: 'bg-sky-50 text-sky-700 border-sky-200',
};

function StatusIcon({ status }: { status: AttendanceStatus }) {
    if (status === 'working') return <PlayCircle size={14} className="text-green-600" />;
    if (status === 'on_break') return <Coffee size={14} className="text-amber-600" />;
    if (status === 'finished') return <CheckCircle size={14} className="text-blue-600" />;
    return <Square size={14} className="text-slate-400" />;
}

function toHMS(isoStr: string | null | undefined): string {
    if (!isoStr) return '---';
    return new Date(isoStr).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function calcActualWork(logs: LogEntry[]): string {
    // clock_in → 出勤, break_start → 休憩開始, break_end → 休憩終了, clock_out → 退勤
    const clockIn  = logs.find(l => l.event_type === 'clock_in');
    const clockOut = logs.find(l => l.event_type === 'clock_out');
    if (!clockIn) return '';

    const start = new Date(clockIn.time).getTime();
    const end   = clockOut ? new Date(clockOut.time).getTime() : Date.now();
    let totalMs = end - start;

    // 全休憩時間を差し引く
    const breakStarts = logs.filter(l => l.event_type === 'break_start');
    const breakEnds   = logs.filter(l => l.event_type === 'break_end');
    breakStarts.forEach((bs, i) => {
        const be = breakEnds[i];
        const breakStart = new Date(bs.time).getTime();
        const breakEnd   = be ? new Date(be.time).getTime() : Date.now();
        totalMs -= (breakEnd - breakStart);
    });

    if (totalMs < 0) totalMs = 0;
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function AttendanceCard({ emp, rec, logs }: { emp: EmployeeData; rec: RecordData | undefined; logs: LogEntry[] }) {
    const status: AttendanceStatus = rec?.status ?? 'not_started';

    const clockIn   = logs.find(l => l.event_type === 'clock_in');
    const breakStart = logs.findLast ? logs.findLast(l => l.event_type === 'break_start') : [...logs].reverse().find(l => l.event_type === 'break_start');
    const breakEnd  = logs.findLast ? logs.findLast(l => l.event_type === 'break_end') : [...logs].reverse().find(l => l.event_type === 'break_end');
    const clockOut  = logs.find(l => l.event_type === 'clock_out');
    const actualWork = calcActualWork(logs);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
            {/* 行1：氏名 + ステータスバッジ */}
            <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-800 truncate">{emp.name}</p>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${STATUS_COLOR[status]}`}>
                    <StatusIcon status={status} />
                    {STATUS_LABEL[status]}
                </span>
            </div>
            {/* 行2：ロール + ID */}
            <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${ROLE_COLOR[emp.specimen_role]}`}>
                    {ROLE_LABEL[emp.specimen_role]}
                </span>
                <span className="text-xs text-slate-400">{emp.user_code ?? emp.id.slice(0, 8)}</span>
            </div>
            {/* 打刻履歴 */}
            <div className="border-t border-slate-100 pt-2 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="w-8 font-semibold text-slate-400 shrink-0">出勤</span>
                    <span className="font-mono">{toHMS(clockIn?.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-8 font-semibold text-slate-400 shrink-0">休憩</span>
                    <span className="font-mono">
                        {breakStart ? `${toHMS(breakStart.time)} - ${toHMS(breakEnd?.time)}` : '---'}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-8 font-semibold text-slate-400 shrink-0">退勤</span>
                        <span className="font-mono">{toHMS(clockOut?.time)}</span>
                    </div>
                    {actualWork && (
                        <span className="text-slate-500 font-medium">実働: {actualWork}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AttendancePage() {
    const supabase = createClient();
    const [mounted, setMounted] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [employees, setEmployees] = useState<EmployeeData[]>([]);
    const [records, setRecords] = useState<Record<string, RecordData>>({});
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetting, setResetting] = useState(false);
    const resetArmedRef = useRef(false);
    const resetSeqIdxRef = useRef(0);
    const resetArmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchLatest = async () => {
        const todayJST = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
        const [recRes, logRes] = await Promise.all([
            supabase.from('attendance_records').select('employee_id, status, time'),
            supabase.from('attendance_logs').select('employee_id, event_type, time')
                .gte('time', `${todayJST}T00:00:00+09:00`)
                .lt('time', `${todayJST}T23:59:59+09:00`)
                .order('time', { ascending: true }),
        ]);
        if (recRes.data) {
            const map: Record<string, RecordData> = {};
            recRes.data.forEach((r: any) => { map[r.employee_id] = { status: r.status, time: r.time }; });
            setRecords(map);
        }
        if (logRes.data) setLogs(logRes.data as LogEntry[]);
    };

    useEffect(() => {
        setMounted(true);
        const init = async () => {
            const [branchRes, empRes] = await Promise.all([
                supabase.from('branches').select('id, name').order('created_at', { ascending: true }),
                supabase.from('users').select('id, name, specimen_role, user_code, branch_id').in('specimen_role', ['driver', 'base']),
            ]);
            const branchList: Branch[] = (branchRes.data || []).map((b: any) => ({ id: b.id, name: b.name }));
            setBranches(branchList);
            if (branchList.length > 0) setSelectedBranchId(branchList[0].id);
            setEmployees((empRes.data || []).map((d: any) => ({
                id: d.id, name: d.name, specimen_role: d.specimen_role,
                user_code: d.user_code, branch_id: d.branch_id,
            })));
            await fetchLatest();
        };
        init();
        const timer = setInterval(fetchLatest, 10000);

        // Shift+Space でアーム → Shift+R→E→S→E→T でリセットモーダルを表示
        const keyHandler = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === ' ') {
                e.preventDefault();
                resetArmedRef.current = true;
                resetSeqIdxRef.current = 0;
                if (resetArmTimerRef.current) clearTimeout(resetArmTimerRef.current);
                resetArmTimerRef.current = setTimeout(() => {
                    resetArmedRef.current = false;
                    resetSeqIdxRef.current = 0;
                }, 8000);
                return;
            }
            if (!resetArmedRef.current) return;
            if (e.key === 'Shift') return;
            if (!e.shiftKey) { resetSeqIdxRef.current = 0; return; }
            const expected = RESET_SEQUENCE[resetSeqIdxRef.current];
            if (e.key.toUpperCase() !== expected) { resetSeqIdxRef.current = 0; return; }
            resetSeqIdxRef.current += 1;
            if (resetSeqIdxRef.current === RESET_SEQUENCE.length) {
                resetArmedRef.current = false;
                resetSeqIdxRef.current = 0;
                if (resetArmTimerRef.current) clearTimeout(resetArmTimerRef.current);
                setShowResetModal(true);
            }
        };
        window.addEventListener('keydown', keyHandler);

        return () => { clearInterval(timer); window.removeEventListener('keydown', keyHandler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleReset = async () => {
        setResetting(true);
        const allIds = employees.map(e => e.id);
        const todayJST = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
        await Promise.all([
            allIds.length > 0 ? supabase.from('attendance_records').delete().in('employee_id', allIds) : Promise.resolve(),
            allIds.length > 0 ? supabase.from('attendance_logs').delete()
                .in('employee_id', allIds)
                .gte('time', `${todayJST}T00:00:00+09:00`)
                .lt('time',  `${todayJST}T23:59:59+09:00`) : Promise.resolve(),
        ]);
        setRecords({});
        setLogs([]);
        setShowResetModal(false);
        setResetting(false);
    };

    if (!mounted) return null;

    const branchEmployees = employees.filter(e => e.branch_id === selectedBranchId);
    const sorted = [...branchEmployees]
        .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.user_code || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.specimen_role === b.specimen_role ? a.name.localeCompare(b.name, 'ja') : a.specimen_role === 'base' ? -1 : 1);

    const statusCounts = {
        working:     branchEmployees.filter(e => records[e.id]?.status === 'working').length,
        on_break:    branchEmployees.filter(e => records[e.id]?.status === 'on_break').length,
        finished:    branchEmployees.filter(e => records[e.id]?.status === 'finished').length,
        not_started: branchEmployees.filter(e => !records[e.id] || records[e.id]?.status === 'not_started').length,
    };

    return (
        <>
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">勤怠管理</h1>
                    <p className="text-sm text-muted-foreground mt-1">拠点長・ドライバーの出勤状況（10秒ごとに自動更新）</p>
                </div>
            </div>

            {/* 拠点タブ */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-0.5 px-2">
                    {branches.map(b => (
                        <button key={b.id} onClick={() => { setSelectedBranchId(b.id); setSearchQuery(''); }}
                            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
                                selectedBranchId === b.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            )}>
                            <Building2 size={14} />
                            {b.name}
                            <span className={cn('text-xs font-normal', selectedBranchId === b.id ? 'text-blue-400' : 'text-muted-foreground/60')}>
                                {employees.filter(e => e.branch_id === b.id).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ステータス集計 */}
            {branchEmployees.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {([
                        { key: 'working', label: '勤務中', count: statusCounts.working, color: 'bg-green-100 text-green-700 border-green-200' },
                        { key: 'on_break', label: '休憩中', count: statusCounts.on_break, color: 'bg-amber-100 text-amber-700 border-amber-200' },
                        { key: 'finished', label: '退勤済', count: statusCounts.finished, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                        { key: 'not_started', label: '未出勤', count: statusCounts.not_started, color: 'bg-slate-100 text-slate-600 border-slate-200' },
                    ] as const).map(({ key, label, count, color }) => count > 0 && (
                        <span key={key} className={`px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
                            {label}: {count}名
                        </span>
                    ))}
                </div>
            )}

            {/* 検索 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="名前・ユーザーIDで検索..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* カード一覧 */}
            {branches.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">拠点・支社が登録されていません</p>
                </div>
            ) : sorted.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{searchQuery ? 'スタッフが見つかりません' : 'この拠点にスタッフが登録されていません'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted.map(emp => (
                        <AttendanceCard
                            key={emp.id}
                            emp={emp}
                            rec={records[emp.id]}
                            logs={logs.filter(l => l.employee_id === emp.id)}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* リセット確認モーダル */}
        {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <h2 className="text-base font-bold text-slate-800">勤怠データのリセット</h2>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-sm text-slate-700">
                            本日（{new Date().toLocaleDateString('ja-JP')}）の<br />
                            <strong>全拠点・全配送員の勤怠データ</strong>をリセットします。
                        </p>
                        <p className="text-sm text-red-600 mt-2 font-medium">
                            出勤記録・打刻ログがすべて削除されます。この操作は取り消せません。
                        </p>
                        <div className="mt-2 text-xs text-slate-400">
                            対象: {employees.length}名（拠点長 {employees.filter(e => e.specimen_role === 'base').length}名 / ドライバー {employees.filter(e => e.specimen_role === 'driver').length}名）
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                        <button
                            onClick={() => setShowResetModal(false)}
                            disabled={resetting}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={resetting}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                            {resetting ? 'リセット中…' : 'リセットする'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

AttendancePage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
}
