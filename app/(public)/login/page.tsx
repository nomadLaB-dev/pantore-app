'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, Loader2, AlertCircle, Wheat } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import Image from 'next/image';

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
            if (!res.ok) throw new Error('ログインに失敗しました。認証情報を確認してください。');
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
        <div className="min-h-screen flex bg-[#FDFAF6] dark:bg-[#1a1510] overflow-hidden">
            {/* Left — Bakery image panel (desktop only) */}
            <div className="hidden lg:block lg:w-[52%] relative">
                <Image
                    src="/hero-bakery.png"
                    alt="パントリーに並ぶパン"
                    fill
                    className="object-cover object-center"
                    priority
                />
                {/* Overlay with branding */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
                <div className="absolute bottom-12 left-10 text-white drop-shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <Layers className="w-9 h-9" />
                        <span className="font-bold text-3xl tracking-tight">Pantore</span>
                    </div>
                    <p className="text-white/80 text-base max-w-xs leading-relaxed">
                        人・資産・契約のすべてを、<br />一つのパントリーへ。
                    </p>
                </div>
                {/* Gold shimmer accent line */}
                <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300/0 via-yellow-300/60 to-yellow-300/0" />
            </div>

            {/* Right — Login form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
                {/* Subtle warm background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent dark:from-amber-900/20 dark:via-transparent dark:to-transparent pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm z-10"
                >
                    {/* Logo — mobile only */}
                    <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
                        <Layers className="w-8 h-8 text-amber-700 dark:text-amber-500" />
                        <span className="font-bold text-xl tracking-tight text-amber-900 dark:text-amber-100">Pantore</span>
                    </div>

                    <h1 className="text-2xl font-bold mb-1 text-amber-950 dark:text-amber-50">おかえりなさい</h1>
                    <p className="text-amber-800/60 dark:text-amber-300/60 text-sm mb-8">
                        アカウント情報を入力してログインしてください
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-amber-900 dark:text-amber-200">メールアドレス</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-12 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 text-amber-950 dark:text-amber-50 placeholder:text-amber-400/60 dark:placeholder:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-amber-900 dark:text-amber-200">パスワード</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-12 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 text-amber-950 dark:text-amber-50 placeholder:text-amber-400/60 dark:placeholder:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-2 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-amber-700/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ログイン <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-amber-200 dark:bg-amber-800" />
                        <span className="text-xs text-amber-500">または</span>
                        <div className="flex-1 h-px bg-amber-200 dark:bg-amber-800" />
                    </div>

                    {/* Sign-up CTA */}
                    <Link href="/register">
                        <button className="w-full h-12 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all">
                            <Wheat className="w-4 h-4" />
                            新しくはじめる
                        </button>
                    </Link>

                    <p className="mt-6 text-center text-xs text-amber-600/60 dark:text-amber-500/50">
                        <Link href="/" className="hover:text-amber-700 dark:hover:text-amber-400 underline-offset-2 hover:underline">
                            ← トップページへ
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
