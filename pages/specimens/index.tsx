'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { FlaskConical, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SpecimenCsvImportModal } from '@/components/modals/specimen-csv-import-modal';
import { DeleteAllSpecimensModal } from '@/components/modals/delete-all-specimens-modal';
import { useCsvDeleteShortcut } from '@/lib/hooks/use-csv-delete-shortcut';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    '完了': 'default',
    '検査中': 'secondary',
    '受付済': 'outline',
    '集荷待ち': 'destructive',
};

export default function SpecimensPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

    useCsvDeleteShortcut(() => setShowCsvModal(true), () => setShowDeleteAllModal(true));

    const { data: specimens = [], isLoading } = useQuery<any[]>({
        queryKey: ['specimens'],
        queryFn: async () => (await fetch('/api/specimens')).json(),
    });

    const refresh = () => qc.invalidateQueries({ queryKey: ['specimens'] });

    const filtered = specimens.filter(s =>
        !search ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.patient.toLowerCase().includes(search.toLowerCase()) ||
        s.type.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">検体一覧</h1>
                    <p className="text-sm text-muted-foreground mt-1">検体の受付・追跡・管理</p>
                </div>
            </div>

            <SpecimenCsvImportModal open={showCsvModal} onClose={() => setShowCsvModal(false)} onImported={refresh} />
            <DeleteAllSpecimensModal open={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} specimenCount={specimens.length} onDeleted={refresh} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="検体ID・患者名・種別で検索..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-400">読み込み中...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">検体が見つかりません</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">検体ID</th>
                                <th className="px-4 py-3">患者名</th>
                                <th className="px-4 py-3">種別</th>
                                <th className="px-4 py-3">採取日</th>
                                <th className="px-4 py-3">ステータス</th>
                                <th className="px-4 py-3">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(specimen => (
                                <tr key={specimen.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {specimen.priority && (
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                            )}
                                            <span className="font-mono font-semibold text-slate-800">{specimen.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{specimen.patient}</td>
                                    <td className="px-4 py-3 text-slate-600">{specimen.type}</td>
                                    <td className="px-4 py-3 text-slate-600">{specimen.date}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={STATUS_VARIANT[specimen.status] ?? 'outline'}>
                                            {specimen.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/specimens/${specimen.id}`}
                                            className="text-xs font-semibold text-blue-600 hover:underline"
                                        >
                                            詳細
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

SpecimensPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
