import Link from 'next/link';
import { Utensils, ShieldAlert } from 'lucide-react';

export default function Forbidden() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] p-4 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-[#e7e5e4] max-w-lg w-full relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#ef4444] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-2 bg-[#ef4444] opacity-20"></div>

                <div className="relative inline-block mb-8">
                    <div className="inline-flex p-6 bg-[#fef2f2] rounded-full shadow-inner">
                        {/* Tongs representation using Utensils rotated */}
                        <Utensils className="w-20 h-20 text-[#b91c1c] transform rotate-45" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-[#ef4444] text-white p-2 rounded-full shadow-md">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                </div>

                <h1 className="text-6xl font-black text-[#7f1d1d] mb-2 font-serif">403</h1>
                <h2 className="text-xl font-bold text-[#991b1b] mb-6">関係者以外立ち入り禁止です</h2>

                <p className="text-[#7f1d1d] mb-10 leading-relaxed">
                    このエリア（厨房）に入る権限がありません。<br />
                    必要な権限をお持ちのアカウントで<br />
                    ログインし直してください。
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#b91c1c] text-white font-bold rounded-full hover:bg-[#991b1b] transition-all shadow-md hover:shadow-lg"
                    >
                        ログイン画面へ
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#78350f] border-2 border-[#e7e5e4] font-bold rounded-full hover:bg-[#f5f5f4] transition-all shadow-sm hover:shadow-md"
                    >
                        トップページへ
                    </Link>
                </div>
            </div>

            <p className="mt-8 text-[#a8a29e] text-sm font-serif">Pantore Bakery System</p>
        </div>
    );
}
