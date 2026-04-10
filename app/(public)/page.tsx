'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Activity, Users, Car, Building2, ShieldCheck, Layers, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { title: '社員管理', desc: '稼働率、シフト、異動履歴を一元管理。', icon: Users },
    { title: '資産管理', desc: '車両や不動産の保有状況と利用履歴を統合します。', icon: Building2 },
    { title: '車両・事故記録', desc: '事故の記録や、リース車両の管理をデジタル化。', icon: Car },
    { title: '契約・期日アラート', desc: '契約期限が近づくと自動でアラート通知。', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col min-h-screen selection:bg-amber-600 selection:text-white bg-[#FDFAF6] dark:bg-[#1a1510] text-[#2c1f0e] dark:text-[#f5ede0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFAF6]/80 dark:bg-[#1a1510]/80 backdrop-blur-md border-b border-[#d4ab7a]/30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-8 h-8 text-amber-700 dark:text-amber-500" />
            <span className="font-bold text-xl tracking-tight text-amber-900 dark:text-amber-100">Pantore</span>
          </div>
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors text-amber-800 dark:text-amber-300"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <Link
              href="/login"
              className="text-sm font-medium text-amber-800 dark:text-amber-300 hover:text-amber-600 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16">
        {/* Hero Section — split layout */}
        <section className="relative min-h-[90vh] flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Text */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 z-10 bg-gradient-to-b from-[#FDFAF6] to-[#f5e8d0] dark:from-[#1a1510] dark:to-[#24190f]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 mb-6 text-sm text-amber-700 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-800">
                <Activity className="w-4 h-4" />
                <span>次世代の企業リソース管理</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-amber-950 dark:text-amber-50 leading-tight">
                人・資産・契約の<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-yellow-500 dark:from-amber-400 dark:to-yellow-300">
                  すべてを一つに。
                </span>
              </h1>
              <p className="text-base md:text-lg text-amber-800/80 dark:text-amber-200/70 mb-12 max-w-lg leading-relaxed">
                Pantoreは、企業の社員の稼働から、車両・不動産などの物理資産、契約期限までを劇的にシンプルに統合管理するモダンERPです。
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/login">
                  <button className="h-13 px-7 py-3.5 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-full font-semibold text-base flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-700/30">
                    システムを試す
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right: Bakery Image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0 }}
            className="relative lg:w-[52%] h-72 lg:h-auto overflow-hidden"
          >
            <Image
              src="/hero-bakery.png"
              alt="パントリーに並ぶパン"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Gold tong overlay accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDFAF6] via-transparent to-transparent dark:from-[#1a1510] dark:via-transparent dark:to-transparent lg:block hidden" />
            {/* Bottom fade for mobile */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f5e8d0] dark:from-[#24190f] to-transparent lg:hidden" />
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-[#f5e8d0]/60 dark:bg-[#211810]/60 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-amber-950 dark:text-amber-50">点在する情報を、結びつける。</h2>
              <p className="text-amber-800/70 dark:text-amber-200/60 max-w-2xl mx-auto">
                バラバラに管理されていたスプレッドシートや紙の書類を廃止し、社員と資産がどのように紐づいているか、履歴を全て残します。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-[#FDFAF6] dark:bg-[#2a1e13] border border-amber-200/60 dark:border-amber-900/40 relative overflow-hidden group hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-100 dark:hover:shadow-amber-950"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-150 transition-transform duration-500 pointer-events-none">
                    <f.icon className="w-32 h-32" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-6">
                    <f.icon className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-amber-950 dark:text-amber-50">{f.title}</h3>
                  <p className="text-amber-800/70 dark:text-amber-300/60 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 relative overflow-hidden bg-amber-800 dark:bg-amber-900">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]"></div>
          {/* Gold shimmer */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 opacity-60" />
          <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">管理の複雑さから解放されよう</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              今すぐログインして、統合された次世代のダッシュボードを体験してください。
            </p>
            <Link href="/login">
              <button className="h-14 px-8 bg-white text-amber-800 hover:bg-amber-50 rounded-full font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl mx-auto">
                ログイン画面へ
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-amber-700/60 dark:text-amber-400/50 text-sm border-t border-amber-200/40 dark:border-amber-900/40 bg-[#FDFAF6] dark:bg-[#1a1510]">
        <p>&copy; {new Date().getFullYear()} Pantore ERP. All rights reserved.</p>
      </footer>
    </div>
  );
}
