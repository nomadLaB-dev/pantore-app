"use client";

import React from 'react';
import { Search, Plus, Filter, Monitor, ChevronRight } from 'lucide-react';
import { type UserSummary } from '@/lib/types';

interface Props {
  users: UserSummary[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onUserClick: (id: string) => void;
  onOpenCreateModal: () => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>{status === 'active' ? '在籍中' : '退職済'}</span>;
};

export const UserList = ({ users, searchTerm, setSearchTerm, onUserClick, onOpenCreateModal }: Props) => {
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">ユーザー一覧</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
            <Filter className="w-4 h-4" /> フィルター
          </button>
          <button onClick={onOpenCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> ユーザー登録
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr><th className="px-6 py-3 text-gray-500">氏名</th><th className="px-6 py-3 text-gray-500">所属</th><th className="px-6 py-3 text-gray-500">デバイス</th><th className="px-6 py-3 text-gray-500">ステータス</th><th className="px-6 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(user => (
              <tr key={user.id} onClick={() => onUserClick(user.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{user.name}</td>
                <td className="px-6 py-4">{user.company} - {user.dept}</td>
                <td className="px-6 py-4">{user.deviceCount > 0 ? <span className="flex items-center gap-1 text-blue-600 font-medium"><Monitor className="w-3 h-3" /> {user.deviceCount}台</span> : <span className="text-gray-400">-</span>}</td>
                <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                <td className="px-6 py-4 text-right"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">該当なし 👻</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};