'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Activity, Users, Car, Building2, ShieldCheck, Layers, Moon, Sun, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      title: '社員管理',
      desc: '稼働率、シフト、異動履歴を一元管理。',
      icon: Users,
    },
    {
      title: '資産管理',
      desc: '車両や不動産の保有状況と利用履歴を統合します。',
      icon: Building2,
    },
    {
      title: '車両・事故記録',
      desc: '事故の記録や、リース車両の管理をデジタル化。',
      icon: Car,
    },
    {
      title: '契約・期日アラート',
      desc: '契約期限が近づくと自動でアラート通知。',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-8 h-8 text-brand-500" />
            <span className="font-bold text-xl tracking-tight">Pantore</span>
          </div>
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <Link
              href="/login"
              className="text-sm font-medium hover:text-brand-500 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/50 via-background to-background dark:from-brand-900/20 dark:via-background dark:to-background"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10 text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-6 text-sm text-brand-600 dark:text-brand-400 font-medium">
              <Activity className="w-4 h-4" />
              <span>次世代の企業リソース管理</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              人・資産・契約の<br />
              <span className="text-gradient">すべてを一つに。</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
              Pantoreは、企業の社員の稼働から、車両・不動産などの物理資産、契約期限までを劇的にシンプルに統合管理するモダンERPです。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <button className="h-14 px-8 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-medium text-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/30">
                  システムを試す
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50/50 dark:bg-slate-900/20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">点在する情報を、結びつける。</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                バラバラに管理されていたスプレッドシートや紙の書類を廃止し、社員と資産がどのように紐づいているか、履歴を全て残します。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="glass p-8 rounded-3xl relative overflow-hidden group hover:border-brand-500/50 transition-colors"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-150 transition-transform duration-500 pointer-events-none">
                    <f.icon className="w-32 h-32" />
                  </div>
                  <f.icon className="w-10 h-10 text-brand-500 mb-6" />
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-brand-500 text-white">
            {/* Pattern background */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">管理の複雑さから解放されよう</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              今すぐログインして、統合された次世代のダッシュボードを体験してください。
            </p>
            <Link href="/login">
              <button className="h-14 px-8 bg-white text-brand-600 hover:bg-slate-50 rounded-full font-bold text-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-xl mx-auto">
                ログイン画面へ
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm border-t border-border">
        <p>&copy; {new Date().getFullYear()} Pantore ERP. All rights reserved.</p>
      </footer>
    </div>
  );
}
