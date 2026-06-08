'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Layers, CheckCircle2, Wheat } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const perks = [
    '社員・資産・契約を一元管理',
    '支社単位のマルチテナント対応',
    'サブスク費用の可視化',
    'リアルタイムな契約期限アラート',
];

export default function RegisterPage() {
    const [step, setStep] = useState<'form' | 'done'>('form');
    const [form, setForm] = useState({ company: '', name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 800)); // mock delay
        setStep('done');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-[#FDFAF6] dark:bg-[#1a1510] overflow-hidden">
            {/* Left — value prop panel */}
            <div className="hidden lg:flex lg:w-[46%] flex-col justify-center px-16 bg-gradient-to-br from-amber-800 to-amber-950 text-white relative overflow-hidden">
                {/* Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]" />
                {/* Gold top line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300/0 via-yellow-300/70 to-yellow-300/0" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-12">
                        <Layers className="w-9 h-9" />
                        <span className="font-bold text-2xl tracking-tight">Pantore</span>
                    </div>

                    <h2 className="text-3xl font-bold mb-3 leading-tight">
                        人・資産・契約の<br />すべてを一つに。
                    </h2>
                    <p className="text-amber-200/80 mb-10 text-sm leading-relaxed">
                        Pantoreは企業の社員稼働から車両・不動産・サブスクまでを<br />劇的にシンプルに統合管理するモダンERPです。
                    </p>

                    <ul className="space-y-4">
                        {perks.map((p) => (
                            <li key={p} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-yellow-300 shrink-0" />
                                <span className="text-sm">{p}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right — registration form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent dark:from-amber-900/20 dark:via-transparent dark:to-transparent pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm z-10"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
                        <Layers className="w-8 h-8 text-amber-700 dark:text-amber-500" />
                        <span className="font-bold text-xl tracking-tight text-amber-900 dark:text-amber-100">Pantore</span>
                    </div>

                    {step === 'done' ? (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-6">
                                <Wheat className="w-8 h-8 text-amber-700 dark:text-amber-400" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-amber-950 dark:text-amber-50">登録完了！</h1>
                            <p className="text-amber-800/60 dark:text-amber-300/60 text-sm mb-8">
                                アカウントの準備が整いました。<br />ダッシュボードへどうぞ。
                            </p>
                            <Link href="/dashboard">
                                <button className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-700/20">
                                    ダッシュボードへ <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold mb-1 text-amber-950 dark:text-amber-50">新しくはじめる</h1>
                            <p className="text-amber-800/60 dark:text-amber-300/60 text-sm mb-8">
                                組織の情報を入力してアカウントを作成します
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-amber-900 dark:text-amber-200">会社名 / 組織名</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.company}
                                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                                        className="w-full h-12 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 text-amber-950 dark:text-amber-50 placeholder:text-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                                        placeholder="株式会社〇〇"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-amber-900 dark:text-amber-200">お名前</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full h-12 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 text-amber-950 dark:text-amber-50 placeholder:text-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                                        placeholder="山田 太郎"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-amber-900 dark:text-amber-200">メールアドレス</label>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full h-12 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 text-amber-950 dark:text-amber-50 placeholder:text-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                                        placeholder="name@company.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-amber-900 dark:text-amber-200">パスワード</label>
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full h-12 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 text-amber-950 dark:text-amber-50 placeholder:text-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 mt-2 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-amber-700/20"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : <>アカウントを作成 <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>

                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-amber-200 dark:bg-amber-800" />
                                <span className="text-xs text-amber-500">または</span>
                                <div className="flex-1 h-px bg-amber-200 dark:bg-amber-800" />
                            </div>

                            <Link href="/login">
                                <button className="w-full h-12 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all">
                                    すでにアカウントをお持ちの方
                                </button>
                            </Link>

                            <p className="mt-6 text-center text-xs text-amber-600/50 dark:text-amber-500/40">
                                <Link href="/" className="hover:text-amber-700 dark:hover:text-amber-400 underline-offset-2 hover:underline">← トップページへ</Link>
                            </p>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
