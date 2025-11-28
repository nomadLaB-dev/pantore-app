"use client";

import React, { useState, useEffect } from 'react';
import { Building2, X, Save } from 'lucide-react';
import { type EmploymentHistory, type MasterData } from '@/lib/types';
import { fetchMasterDataAction } from '@/app/actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (history: EmploymentHistory) => void;
}

export const HistoryModal = ({ isOpen, onClose, onSave }: Props) => {
  const [masterData, setMasterData] = useState<MasterData>({
    companies: [],
    departments: [],
    branches: []
  });

  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    company: '',
    dept: '',
    branch: '',
    position: ''
  });

  // Fetch master data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMasterDataAction().then(data => {
        setMasterData(data);
        // Set default company if empty
        if (!formData.company && data.companies.length > 0) {
          setFormData(prev => ({ ...prev, company: data.companies[0] }));
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.dept) {
      alert('部署名は必須です！');
      return;
    }
    onSave({
      id: Date.now(),
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      company: formData.company,
      dept: formData.dept,
      branch: formData.branch,
      position: formData.position || '一般'
    });
    onClose();
    // リセット
    setFormData({
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      company: masterData.companies[0] || '',
      dept: '',
      branch: '',
      position: ''
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <Building2 className="w-5 h-5 text-blue-600" /> 履歴追加
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">開始日</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">終了日 (任意)</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">会社 (マスタ選択)</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
              {masterData.companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">拠点</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })}>
                <option value="">選択</option>
                {masterData.branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">部署</label>
              <input list="depts" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="入力または選択" value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })} />
              <datalist id="depts">
                {masterData.departments.map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">役職</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="例: マネージャー" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> 追加
          </button>
        </div>
      </div>
    </div>
  );
};