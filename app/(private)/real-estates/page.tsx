import { Building2 } from 'lucide-react';

export default function RealEstatesPage() {
    return (
        <div className="flex flex-col min-h-[60vh] items-center justify-center p-12 text-slate-500">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Building2 className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">不動産管理</h2>
            <p className="mt-4 text-sm text-center max-w-md">
                このページは現在開発中です。<br />今後、オフィスや駐車場の契約状況などを統合管理する機能が追加されます。
            </p>
        </div>
    );
}
