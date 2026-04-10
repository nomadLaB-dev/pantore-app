import { ShieldCheck } from 'lucide-react';

export default function ContractsPage() {
    return (
        <div className="flex flex-col min-h-[60vh] items-center justify-center p-12 text-slate-500">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <ShieldCheck className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">契約管理</h2>
            <p className="mt-4 text-sm text-center max-w-md">
                このページは現在開発中です。<br />今後、全資産に対する契約更新アラートの自動化などが追加されます。
            </p>
        </div>
    );
}
