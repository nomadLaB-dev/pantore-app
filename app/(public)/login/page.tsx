'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

export default function LoginPage() {
    const router = useRouter();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                throw new Error('ログインに失敗しました。認証情報を確認してください。');
            }

            const user = await res.json();
            setCurrentUser(user);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-4 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/50 via-background to-background dark:from-brand-900/30 dark:via-background dark:to-background pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md z-10"
            >
                <div className="glass rounded-3xl p-8 shadow-xl relative overflow-hidden text-center">
                    <div className="flex justify-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <Layers className="w-10 h-10 text-brand-500" />
                            <span className="font-bold text-2xl tracking-tight">Pantore</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold mb-2">おかえりなさい</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                        アカウント情報を入力してログインしてください
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5 text-left">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 ml-1">メールアドレス</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-border rounded-xl px-4 text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 ml-1">パスワード</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-border rounded-xl px-4 text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>ログイン <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
