'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Activity, History, CalendarDays, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Employee, WorkloadHistory } from '@/types';
import { cn } from '@/lib/utils';

export default function EmployeeDetailPage() {
    const { id } = useParams() as { id: string };
    const [activeTab, setActiveTab] = useState<'workload' | 'shifts' | 'history'>('workload');

    const { data: employee, isLoading: isEmpLoading } = useQuery<Employee>({
        queryKey: ['employee', id],
        queryFn: async () => {
            const res = await fetch(`/api/employees/${id}`);
            return res.json();
        }
    });

    const { data: workloads, isLoading: isWlLoading } = useQuery<WorkloadHistory[]>({
        queryKey: ['employee_workloads', id],
        queryFn: async () => {
            const res = await fetch(`/api/employees/${id}/workloads`);
            return res.json();
        }
    });

    if (isEmpLoading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;
    if (!employee) return <div className="p-8 text-center text-slate-500">社員が見つかりません。</div>;

    const tabs = [
        { id: 'workload', name: '人月・稼働履歴', icon: Activity },
        { id: 'shifts', name: 'シフト', icon: CalendarDays },
        { id: 'history', name: '異動・資産利用履歴', icon: History },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Link href="/employees" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                社員一覧へ戻る
            </Link>

            {/* Header Profile */}
            <div className="bg-white dark:bg-[#0f172a] border border-border shadow-sm rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
                <button className="absolute top-6 right-6 p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block">
                    <Edit3 className="w-5 h-5" />
                </button>

                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center flex-shrink-0">
                    <User className="w-10 h-10 text-slate-400" />
                </div>

                <div className="text-center md:text-left flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{employee.name}</h1>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium justify-center align-middle ${employee.leaveDate ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            }`}>
                            {employee.leaveDate ? '退職済' : '在籍中'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 mt-6">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">メールアドレス</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{employee.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">入社日</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{new Date(employee.hireDate).toLocaleDateString('ja-JP')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-[#0f172a] border border-border shadow-sm rounded-2xl overflow-hidden">
                <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap outline-none",
                                activeTab === tab.id
                                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-brand-500" : "text-slate-400")} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'workload' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">稼働履歴 (人月)</h3>
                                <button className="text-sm text-brand-500 font-medium hover:text-brand-600">新しい履歴を追加</button>
                            </div>

                            {isWlLoading ? (
                                <p className="text-slate-500 text-center py-6">読み込み中...</p>
                            ) : workloads?.length === 0 ? (
                                <p className="text-slate-500 text-center py-6">稼働履歴がありません</p>
                            ) : (
                                <div className="space-y-3">
                                    {workloads?.map((wl) => (
                                        <div key={wl.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl">
                                            <div className="mb-2 sm:mb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">稼働率: {wl.workload * 100}%</span>
                                                    {wl.endDate === null && (
                                                        <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full font-medium">現在</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(wl.startDate).toLocaleDateString('ja-JP')} 〜 {wl.endDate ? new Date(wl.endDate).toLocaleDateString('ja-JP') : '現在'}
                                                </p>
                                            </div>
                                            <div>
                                                {/* More Actions dropdown placeholder */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'shifts' && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                            <CalendarDays className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                            <p>シフト機能は開発中です</p>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                            <History className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                            <p>履歴データは開発中です</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
