'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';

export default function QRLoginPage() {
    const router = useRouter();
    const { id, k: qrToken } = router.query as { id?: string; k?: string };

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [autoLogging, setAutoLogging] = useState(false);

    const supabase = createClient();

    const loginWithEmail = async (email: string, pw: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        router.push('/dashboard');
    };

    const findEmployeeByUserCode = async (userCode: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, qr_token')
            .eq('user_code', userCode)
            .single();
        if (error || !data) throw new Error('ユーザーが見つかりません');
        return data;
    };

    // QRトークン自動認証
    useEffect(() => {
        if (!qrToken || !id) return;
        setAutoLogging(true);

        const tryAutoLogin = async () => {
            try {
                const employee = await findEmployeeByUserCode(id);
                if (employee.qr_token !== qrToken) {
                    setError('QRコードが無効です。パスワードでログインしてください。');
                    setAutoLogging(false);
                    return;
                }
                await loginWithEmail(employee.email, qrToken);
            } catch (e: any) {
                setError(e.message ?? '自動ログインに失敗しました');
                setAutoLogging(false);
            }
        };

        tryAutoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, qrToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setError('');
        setLoading(true);
        try {
            const employee = await findEmployeeByUserCode(id);
            await loginWithEmail(employee.email, password);
        } catch (e: any) {
            setError(e.message ?? 'ログインに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (autoLogging) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">QRコードで認証中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-xl font-bold text-slate-800 mb-1">SpecimenDX ログイン</h1>
                <p className="text-sm text-slate-500 mb-6">ユーザーID: <span className="font-mono font-bold">{id}</span></p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="パスワードを入力"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}
