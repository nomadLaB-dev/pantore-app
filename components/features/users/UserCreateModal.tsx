"use client";

import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { type UserSummary, type Role, type MasterData } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserSummary) => void;
  masterData?: MasterData;
}

export const UserCreateModal = ({ isOpen, onClose, onSave, masterData }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: masterData?.companies[0] || '', // Default to first company or empty
    dept: '',
    role: 'member' // Changed default role to 'member'
  });

  // Update default company when masterData loads
  React.useEffect(() => {
    if (masterData?.companies.length && !formData.company) {
      setFormData(prev => ({ ...prev, company: masterData.companies[0] }));
    }
  }, [masterData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      alert('氏名とメールアドレスは必須です！😣');
      return;
    }
    onSave({
      id: `TEMP_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      company: formData.company,
      dept: formData.dept || '未配属',
      role: formData.role as Role,
      deviceCount: 0,
      status: 'active'
    });
    onClose();
    setFormData({ name: '', email: '', company: masterData?.companies[0] || '', dept: '', role: 'member' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <Plus className="w-5 h-5 text-blue-600" /> ユーザー登録
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">権限</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="member">一般 (User)</option>
              <option value="admin">管理者 (Admin)</option>
            </select>
          </div>
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="氏名" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="メール" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
              <option value="">会社を選択</option>
              {masterData?.companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="部署" list="dept-options" value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })} />
            <datalist id="dept-options">
              {masterData?.departments.map(d => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
      </div>
    </div>
  );
};