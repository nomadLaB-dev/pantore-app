'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'

import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, CheckCircle, Clock, Truck, Building, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SpecimenDetailPage() {
    const { id } = useRouter().query;

    const { data: specimen, isLoading } = useQuery<any>({
        queryKey: ['specimen', id],
        queryFn: async () => {
            const res = await fetch(`/api/specimens/${id}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: Boolean(id),
    });

    if (isLoading) {
        return <div className="py-20 text-center text-slate-400">読み込み中...</div>;
    }

    if (!specimen) {
        return (
            <div className="space-y-6">
                <Link href="/specimens" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={16} /> 検体一覧へ戻る
                </Link>
                <div className="py-20 text-center text-slate-400">
                    <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">検体が見つかりません</p>
                    <p className="text-sm mt-1">ID: {id}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/specimens" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={16} /> 検体一覧へ戻る
                </Link>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <FlaskConical size={20} className="text-blue-600" />
                        {specimen.id}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{specimen.type} 検体</p>
                </div>
                <Badge variant="secondary">{specimen.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="font-semibold text-slate-800">患者・採取情報</h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500">患者名</dt>
                            <dd className="font-medium text-slate-800">{specimen.patient}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">採取日</dt>
                            <dd className="font-medium text-slate-800">{specimen.collectDate}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">採取医療機関</dt>
                            <dd className="font-medium text-slate-800">{specimen.clinic}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">担当医師</dt>
                            <dd className="font-medium text-slate-800">{specimen.doctor}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">備考</dt>
                            <dd className="font-medium text-slate-800">{specimen.notes}</dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-800 mb-4">搬送タイムライン</h2>
                    {!specimen.timeline?.length && (
                        <p className="text-sm text-slate-400 text-center py-6">タイムラインの記録がありません</p>
                    )}
                    <ol className="space-y-4">
                        {(specimen.timeline || []).map((step: any, i: number) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {step.done ? <CheckCircle size={16} /> : <Clock size={16} />}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.step}</p>
                                    {step.time && <p className="text-xs text-slate-500">{step.time}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    <FileText size={15} /> ラベル印刷
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                    情報を編集
                </button>
            </div>
        </div>
    );
}

SpecimenDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
