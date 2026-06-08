'use client';
import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabase/client';

type QrUser = { id: string; name: string; user_code: string | null; qr_token: string | null };

export function QRModal({ user, onClose, onRegenerate }: { user: QrUser; onClose: () => void; onRegenerate: () => void }) {
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
            const { error } = await supabase.from('users').update({ qr_token: newToken }).eq('id', user.id);
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
