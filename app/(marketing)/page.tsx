import React from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    Users,
    Zap,
    Headphones,
    LayoutDashboard,
    Laptop,
    RefreshCw,
    Lock,
    MessageSquare,
    MoreHorizontal
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="overflow-hidden bg-[#fdfbf7]">
            {/* Hero Section */}
            <section className="relative pt-32 pb-48 overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80"
                        alt="Bakery Interior"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#fffbeb]/95 via-[#fffbeb]/80 to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur text-[#92400e] text-xs font-bold mb-8 border border-[#d6d3d1] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pantore-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-pantore-500"></span>
                            </span>
                            焼きたて（β版）テストユーザー募集中
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-[#451a03] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 font-serif leading-tight">
                            IT資産管理を、<br />
                            もっと<span className="text-pantore-600 underline decoration-4 decoration-pantore-300/50 underline-offset-4">ふっくら</span>と。
                        </h1>
                        <p className="text-lg md:text-xl text-[#78350f] mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 font-medium leading-relaxed bg-white/30 backdrop-blur-sm p-4 rounded-xl border border-white/50 inline-block">
                            「誰が何を使っているかわからない」をゼロに。<br />
                            まるで焼きたてのパンを並べるように、<br />
                            あなたの会社のIT資産をスマートに管理します。
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-8 py-4 bg-[#92400e] text-[#fffbeb] font-bold rounded-full hover:bg-[#78350f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 border-2 border-[#92400e]"
                            >
                                ログイン <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/signup"
                                className="w-full sm:w-auto px-8 py-4 bg-white/80 backdrop-blur text-[#78350f] font-bold rounded-full border-2 border-[#d6d3d1] hover:bg-white hover:border-[#92400e] transition-all flex items-center justify-center shadow-sm"
                            >
                                無料サインアップ
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points (Issues) */}
            <section className="py-24 bg-[#fffbeb] relative">
                <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-[#fdfbf7] to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#451a03] mb-4 font-serif">こんな「焦げ付き」ありませんか？</h2>
                        <p className="text-[#92400e]">成長企業の情シスが直面する、管理の悩み</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <AlertTriangle className="w-8 h-8 text-[#ef4444]" />,
                                title: "台帳の形骸化",
                                desc: "ツールを入れても現場が入力してくれず、結局エクセル管理に戻ってしまう。管理台帳がカチカチに冷え固まる。"
                            },
                            {
                                icon: <RefreshCw className="w-8 h-8 text-[#d97706]" />,
                                title: "オペレーションの負荷",
                                desc: "入社・退職・故障対応...。フローを整備するだけで数ヶ月かかり、その間の業務が属人化してしまう。"
                            },
                            {
                                icon: <Users className="w-8 h-8 text-[#78350f]" />,
                                title: "リソース不足",
                                desc: "専任の情シスを採用するのはコストが高い。兼務では手が回らず、セキュリティリスクが高まる。"
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-[#e7e5e4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(120,53,15,0.15)] transition-all hover:-translate-y-1">
                                <div className="bg-[#fdfbf7] w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner mb-6 border border-[#f5f5f4]">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[#451a03] mb-3">{item.title}</h3>
                                <p className="text-[#78350f] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solution (Value Proposition) */}
            <section className="py-24 bg-[#451a03] text-[#fffbeb] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1555507036-ab1f40388085?auto=format&fit=crop&q=80')] bg-cover opacity-20 mix-blend-soft-light"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-4 py-1 rounded-full bg-[#d97706]/20 text-[#fbbf24] font-bold text-sm mb-6 border border-[#d97706]/30">
                                Pantoreの提供価値
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight font-serif">
                                システム × BPaaSで<br />
                                <span className="text-[#fbbf24]">「管理しない管理」</span>を実現
                            </h2>
                            <p className="text-[#d6d3d1] text-lg mb-8 leading-relaxed">
                                単なる管理ツールではありません。100名以上の利用実績に基づく「回るオペレーション」と、
                                社内リソースを使わない「BPaaS」モデルで、あなたの会社のIT資産管理を、焼きたてのパンのようにふっくらと最適化します。
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "100名以上の利用実績に基づく、現場が使いやすいUI",
                                    "BPaaSだから、社内SEの採用・リソース確保が不要",
                                    "導入からオンボーディングまで、専任チームが徹底サポート"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-[#fbbf24] flex-shrink-0" />
                                        <span className="font-medium text-[#f5f5f4]">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#d97706] to-[#92400e] rounded-2xl blur-lg opacity-30"></div>
                            <div className="relative bg-[#292524] rounded-2xl p-8 border border-[#57534e] shadow-2xl">
                                {/* Mock UI Card */}
                                <div className="flex items-center gap-4 mb-6 border-b border-[#57534e] pb-6">
                                    <div className="w-12 h-12 rounded-full bg-[#44403c] flex items-center justify-center border border-[#57534e]">
                                        <Headphones className="w-6 h-6 text-[#d6d3d1]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-[#f5f5f4]">情シス担当 (BPaaS)</p>
                                        <p className="text-sm text-[#a8a29e]">Pantore Support Team</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-[#44403c]/50 p-4 rounded-lg border border-[#57534e]">
                                        <p className="text-sm text-[#d6d3d1]">👋 入社手続き、PC手配、アカウント発行...全部お任せください。</p>
                                    </div>
                                    <div className="bg-[#d97706]/10 p-4 rounded-lg border border-[#d97706]/30">
                                        <p className="text-sm text-[#fbbf24] font-bold">✨ あなたのタスク</p>
                                        <p className="text-2xl font-bold text-white mt-1">0 <span className="text-sm font-normal text-[#d6d3d1]">件</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap */}
            <section className="py-24 bg-[#fdfbf7]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#451a03] mb-4 font-serif">Roadmap</h2>
                        <p className="text-[#92400e]">進化し続けるPantoreの未来</p>
                    </div>

                    <div className="relative">
                        {/* Timeline Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-[#e7e5e4] -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                            {/* NOW */}
                            <div className="bg-white p-6 rounded-2xl border-2 border-[#d97706] shadow-lg transform md:-translate-y-4">
                                <div className="inline-block px-3 py-1 bg-[#d97706] text-white text-xs font-bold rounded-full mb-4">NOW</div>
                                <h3 className="text-lg font-bold text-[#451a03] mb-2">β版テスト運用中</h3>
                                <p className="text-sm text-[#78350f] mb-4">
                                    テストユーザー募集中。<br />
                                    <span className="font-bold text-[#d97706]">1アカウント 500円〜</span><br />
                                    初期費用も安価にスタート可能。
                                </p>
                                <div className="w-full h-2 bg-[#f5f5f4] rounded-full overflow-hidden">
                                    <div className="w-3/4 h-full bg-[#d97706]"></div>
                                </div>
                            </div>

                            {/* Phase 1 (New) */}
                            <div className="bg-white p-6 rounded-2xl border border-[#e7e5e4] shadow-sm opacity-90 hover:opacity-100 transition-opacity">
                                <div className="inline-block px-3 py-1 bg-[#f5f5f4] text-[#78350f] text-xs font-bold rounded-full mb-4">Phase 1</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-5 h-5 text-[#b45309]" />
                                    <h3 className="text-lg font-bold text-[#451a03]">Slack連携Bot</h3>
                                </div>
                                <p className="text-sm text-[#78350f]">
                                    Slackに追加するだけで導入完了。<br />
                                    ユーザーからの依頼を自動でAdminに通知・集約します。
                                </p>
                            </div>

                            {/* Phase 2 (Old Phase 1) */}
                            <div className="bg-white p-6 rounded-2xl border border-[#e7e5e4] shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                <div className="inline-block px-3 py-1 bg-[#f5f5f4] text-[#78350f] text-xs font-bold rounded-full mb-4">Phase 2</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Lock className="w-5 h-5 text-[#b45309]" />
                                    <h3 className="text-lg font-bold text-[#451a03]">サブスク管理</h3>
                                </div>
                                <p className="text-sm text-[#78350f]">
                                    利用SaaSのパスワード管理とコスト可視化機能。<br />
                                    「誰が何の権限を持っているか」を一元管理。
                                </p>
                            </div>

                            {/* Phase 3 (Old Phase 2) */}
                            <div className="bg-white p-6 rounded-2xl border border-[#e7e5e4] shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                                <div className="inline-block px-3 py-1 bg-[#f5f5f4] text-[#78350f] text-xs font-bold rounded-full mb-4">Phase 3</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Headphones className="w-5 h-5 text-[#a8a29e]" />
                                    <h3 className="text-lg font-bold text-[#451a03]">問い合わせ代行</h3>
                                </div>
                                <p className="text-sm text-[#78350f]">
                                    社内問い合わせをAIが一次受け。<br />
                                    必要な通知だけが管理者に届く、スマートなヘルプデスク。
                                </p>
                            </div>

                            {/* Future */}
                            <div className="bg-white p-6 rounded-2xl border border-dashed border-[#d6d3d1] shadow-sm opacity-50">
                                <div className="inline-block px-3 py-1 bg-[#f5f5f4] text-[#78350f] text-xs font-bold rounded-full mb-4">Future</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MoreHorizontal className="w-5 h-5 text-[#d6d3d1]" />
                                    <h3 className="text-lg font-bold text-[#451a03]">TBA</h3>
                                </div>
                                <p className="text-sm text-[#78350f]">
                                    さらなる機能拡張を計画中。<br />
                                    ユーザーの声で進化します。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-white border-t border-[#e7e5e4]">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-[#451a03] mb-6 font-serif">まずは、デモで体験してください</h2>
                    <p className="text-[#92400e] mb-10">
                        アカウント登録は無料。クレジットカードも不要です。<br />
                        今すぐ、新しい資産管理の世界へ。
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-8 py-4 bg-[#92400e] text-[#fffbeb] font-bold rounded-full hover:bg-[#78350f] transition-all shadow-lg hover:shadow-xl gap-2 border-2 border-[#92400e]"
                        >
                            ログイン <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur text-[#78350f] font-bold rounded-full border-2 border-[#d6d3d1] hover:bg-white hover:border-[#92400e] transition-all shadow-sm"
                        >
                            無料サインアップ
                        </Link>
                    </div>                </div>
            </section>
        </div>
    );
}
