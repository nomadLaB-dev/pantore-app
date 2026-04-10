'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter, MoreHorizontal, User } from 'lucide-react';
import { Employee } from '@/types';
import Link from 'next/link';

export default function EmployeesPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: employees, isLoading } = useQuery<Employee[]>({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await fetch('/api/employees');
            if (!res.ok) throw new Error('Failed to fetch employees');
            return res.json();
        }
    });

    const filteredEmployees = employees?.filter(emp =>
        emp.name.includes(searchTerm) || emp.email.includes(searchTerm)
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">社員管理</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">社員情報を一覧表示し、稼働状況などを管理します。</p>
                </div>
                <button className="h-10 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    新規追加
                </button>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-border shadow-sm rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="名前やメールアドレスで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                        />
                    </div>
                    <button className="h-10 px-4 border border-border text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Filter className="w-4 h-4" />
                        フィルター
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">社員名</th>
                                <th className="px-6 py-3 font-medium">メールアドレス</th>
                                <th className="px-6 py-3 font-medium">入社日</th>
                                <th className="px-6 py-3 font-medium text-center">ステータス</th>
                                <th className="px-6 py-3 font-medium text-right">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        読み込み中...
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        社員が見つかりません
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{emp.email}</td>
                                        <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                                            {new Date(emp.hireDate).toLocaleDateString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${emp.leaveDate ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                }`}>
                                                {emp.leaveDate ? '退職済' : '在籍中'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Link href={`/employees/${emp.id}`}>
                                                <button className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors">
                                                    詳細
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
