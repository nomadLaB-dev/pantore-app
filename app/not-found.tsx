import Link from 'next/link';
import { Croissant, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] p-4 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-[#e7e5e4] max-w-lg w-full relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#d97706] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-2 bg-[#d97706] opacity-20"></div>

                <div className="inline-flex p-6 bg-[#fffbeb] rounded-full mb-8 shadow-inner">
                    <Croissant className="w-20 h-20 text-[#d97706]" strokeWidth={1.5} />
                </div>

                <h1 className="text-6xl font-black text-[#78350f] mb-2 font-serif">404</h1>
                <h2 className="text-xl font-bold text-[#92400e] mb-6">お探しのパン（ページ）は<br />見つかりませんでした</h2>

                <p className="text-[#78350f] mb-10 leading-relaxed">
                    申し訳ありません。<br />
                    アクセスしようとしたページは、<br />
                    売り切れか、別の場所に移動した可能性があります。
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-4 bg-[#78350f] text-[#fffbeb] font-bold rounded-full hover:bg-[#451a03] transition-all shadow-lg hover:shadow-xl gap-2 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    トップページへ戻る
                </Link>
            </div>

            <p className="mt-8 text-[#a8a29e] text-sm font-serif">Pantore Bakery System</p>
        </div>
    );
}
