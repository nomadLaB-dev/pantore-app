'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, QrCode, Copy, Check, Edit2, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import type { SpecimenRole } from '@/types';

type EmployeeUser = {
    id: string;
    name: string;
    email: string;
    specimen_role: SpecimenRole | null;
    user_code: string | null;
    qr_token: string | null;
};

const ROLE_LABEL: Record<SpecimenRole, string> = {
    admin: '管理者',
    staff: 'スタッフ',
    base: '拠点',
    driver: 'ドライバー',
};

const ROLE_VARIANT: Record<SpecimenRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    admin: 'default',
    staff: 'secondary',
    base: 'outline',
    driver: 'destructive',
};

function QRModal({ user, onClose, onRegenerate }: { user: EmployeeUser; onClose: () => void; onRegenerate: () => void }) {
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const supabase = createClient();

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/login/${user.user_code ?? user.id}?k=${encodeURIComponent(user.qr_token ?? '')}`;

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(loginUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
    };

    const handleRegenerate = async () => {
        if (!confirm('新しいQRコードを再発行しますか？\n以前のQRコードは無効になります。')) return;
        setRegenerating(true);
        try {
            const newToken = 'qr_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
            const { error } = await supabase.from('employees').update({ qr_token: newToken }).eq('id', user.id);
            if (error) throw error;
            onRegenerate();
        } catch (e: any) {
            alert('QRコードの再生成に失敗しました: ' + e.message);
        } finally { setRegenerating(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">QRコード: {user.name}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <div className="flex justify-center p-4 bg-white border border-slate-100 rounded-xl mb-4">
                    <QRCode value={loginUrl} size={160} />
                </div>
                <p className="text-xs text-slate-500 break-all mb-4 p-2 bg-slate-50 rounded">{loginUrl}</p>
                <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                        {copied ? <><Check size={14} className="text-green-500" /> コピー済み</> : <><Copy size={14} /> URLをコピー</>}
                    </button>
                    <button onClick={handleRegenerate} disabled={regenerating} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {regenerating ? '再発行中...' : '再発行する'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditModal({ user, onClose, onSaved }: { user: EmployeeUser | null; onClose: () => void; onSaved: () => void }) {
    const supabase = createClient();
    const [specimenRole, setSpecimenRole] = useState<string>(user?.specimen_role ?? '');
    const [userCode, setUserCode] = useState(user?.user_code ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('employees').update({
                specimen_role: specimenRole || null,
                user_code: userCode || null,
            }).eq('id', user.id);
            if (error) throw error;
            onSaved();
        } catch (e: any) {
            alert('保存に失敗しました: ' + e.message);
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">検体ロール編集: {user?.name}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">検体システムロール</label>
                        <select value={specimenRole} onChange={e => setSpecimenRole(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                            <option value="">なし（ERP専用）</option>
                            <option value="admin">管理者 (admin)</option>
                            <option value="staff">スタッフ (staff)</option>
                            <option value="base">拠点 (base)</option>
                            <option value="driver">ドライバー (driver)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ユーザーコード (例: A0001)</label>
                        <input type="text" value={userCode} onChange={e => setUserCode(e.target.value)} placeholder="A0001" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {saving ? '保存中...' : '保存する'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UsersPage() {
    const supabase = createClient();
    const [employees, setEmployees] = useState<EmployeeUser[]>([]);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [qrUser, setQrUser] = useState<EmployeeUser | null>(null);
    const [editUser, setEditUser] = useState<EmployeeUser | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('employees').select('id, name, email, specimen_role, user_code, qr_token').order('name');
            setEmployees((data || []).map((d: any) => ({
                id: d.id, name: d.name, email: d.email,
                specimen_role: d.specimen_role as SpecimenRole | null,
                user_code: d.user_code, qr_token: d.qr_token,
            })));
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const filtered = employees.filter(emp => {
        const matchSearch = !search || emp.name.toLowerCase().includes(search.toLowerCase()) || (emp.user_code || '').toLowerCase().includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'all' || (filterRole === 'none' ? !emp.specimen_role : emp.specimen_role === filterRole);
        return matchSearch && matchRole;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {qrUser && <QRModal user={qrUser} onClose={() => setQrUser(null)} onRegenerate={() => { load(); setQrUser(null); }} />}
            {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { load(); setEditUser(null); }} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">ユーザー管理</h1>
                    <p className="text-sm text-muted-foreground mt-1">社員への検体システムロール割り当てとQRコード管理</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="名前・ユーザーコード・メールで検索..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {(['all', 'admin', 'staff', 'base', 'driver', 'none'] as const).map(role => (
                        <button key={role} onClick={() => setFilterRole(role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterRole === role ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            {role === 'all' ? 'すべて' : role === 'none' ? 'ロールなし' : ROLE_LABEL[role as SpecimenRole]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center text-slate-400">読み込み中...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <p className="font-medium">ユーザーが見つかりません</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">名前</th>
                                <th className="px-4 py-3">メール</th>
                                <th className="px-4 py-3">ユーザーコード</th>
                                <th className="px-4 py-3">検体ロール</th>
                                <th className="px-4 py-3">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(emp => (
                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{emp.email}</td>
                                    <td className="px-4 py-3">
                                        {emp.user_code ? <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{emp.user_code}</span> : <span className="text-slate-300 text-xs">未設定</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {emp.specimen_role ? <Badge variant={ROLE_VARIANT[emp.specimen_role]}>{ROLE_LABEL[emp.specimen_role]}</Badge> : <span className="text-slate-300 text-xs">なし</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditUser(emp)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="ロール編集"><Edit2 size={14} /></button>
                                            {emp.user_code && emp.qr_token && (
                                                <button onClick={() => setQrUser(emp)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="QRコード表示"><QrCode size={14} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
