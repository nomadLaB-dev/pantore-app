"use client";

import React, { useState } from 'react';
import { 
  Save, 
  Building2, 
  ShieldCheck, 
  Phone,
  Check,
  List,
  X,
  Plus
} from 'lucide-react';
import { 
  MOCK_SETTINGS, 
  MOCK_MASTER_DATA, 
  OWNERSHIP_LABELS, 
  type OwnershipType,
  type MasterData
} from '@/lib/demo';

// マスタ編集用の小コンポーネント
const MasterEditor = ({ 
  title, 
  items, 
  onUpdate 
}: { 
  title: string, 
  items: string[], 
  onUpdate: (items: string[]) => void 
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onUpdate([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleDelete = (itemToDelete: string) => {
    onUpdate(items.filter(i => i !== itemToDelete));
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-700">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">
            {item}
            <button 
              type="button"
              onClick={() => handleDelete(item)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder={`${title}を追加`} 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pantore-500"
        />
        <button 
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 bg-pantore-100 text-pantore-700 rounded-lg hover:bg-pantore-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(MOCK_SETTINGS);
  const [masterData, setMasterData] = useState<MasterData>(MOCK_MASTER_DATA);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // 🚨 メモリ上のモックデータを書き換え（アプリ全体に反映させるため）
    // 本来はAPIコールでDBを更新する場所
    MOCK_SETTINGS.name = settings.name;
    MOCK_SETTINGS.allowedOwnerships = settings.allowedOwnerships;
    MOCK_SETTINGS.contactLabel = settings.contactLabel;
    MOCK_SETTINGS.contactValue = settings.contactValue;
    
    // マスタデータの更新（配列の中身を入れ替える）
    MOCK_MASTER_DATA.companies.splice(0, MOCK_MASTER_DATA.companies.length, ...masterData.companies);
    MOCK_MASTER_DATA.departments.splice(0, MOCK_MASTER_DATA.departments.length, ...masterData.departments);
    MOCK_MASTER_DATA.branches.splice(0, MOCK_MASTER_DATA.branches.length, ...masterData.branches);

    setTimeout(() => {
      setIsSaving(false);
      alert('設定を保存し、マスタデータを更新しました！✨\n(他の画面でも反映されています)');
    }, 800);
  };

  const toggleOwnership = (type: OwnershipType) => {
    setSettings(prev => {
      const current = prev.allowedOwnerships;
      const next = current.includes(type)
        ? current.filter(t => t !== type) // 削除
        : [...current, type]; // 追加
      return { ...prev, allowedOwnerships: next };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">組織設定</h2>
          <p className="text-sm text-gray-500 mt-1">Pantoreの利用ルールや連絡先、マスタデータを管理します</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. 組織プロフィール */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-pantore-500" />
            組織情報
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">組織名（表示名）</label>
              <input 
                type="text" 
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
              />
            </div>
          </div>
        </div>

        {/* 🆕 4. マスタデータ管理（今回の追加！） */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <List className="w-5 h-5 text-pantore-500" />
            マスタ管理
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            ユーザー登録や履歴追加などで使用する選択肢を管理します。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MasterEditor 
              title="会社リスト" 
              items={masterData.companies} 
              onUpdate={(items) => setMasterData({...masterData, companies: items})} 
            />
            <MasterEditor 
              title="拠点リスト" 
              items={masterData.branches} 
              onUpdate={(items) => setMasterData({...masterData, branches: items})} 
            />
            <MasterEditor 
              title="部署リスト" 
              items={masterData.departments} 
              onUpdate={(items) => setMasterData({...masterData, departments: items})} 
            />
          </div>
        </div>

        {/* 2. 資産ポリシー設定 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-pantore-500" />
            資産管理ポリシー
          </h3>
          <p className="text-sm text-gray-500 mb-4">この組織で利用を許可するPCの調達・所有形態を選択してください。</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(OWNERSHIP_LABELS) as OwnershipType[]).map((type) => {
              const isChecked = settings.allowedOwnerships.includes(type);
              return (
                <div 
                  key={type}
                  onClick={() => toggleOwnership(type)}
                  className={`
                    cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between
                    ${isChecked 
                      ? 'border-pantore-500 bg-pantore-50 text-pantore-900' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-500'}
                  `}
                >
                  <span className="font-bold">{OWNERSHIP_LABELS[type]}</span>
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isChecked ? 'bg-pantore-500 border-pantore-500' : 'border-gray-300'}
                  `}>
                    {isChecked && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 緊急連絡先設定 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-pantore-500" />
            緊急連絡先・サポート
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ラベル（呼称）</label>
              <input 
                type="text" 
                value={settings.contactLabel}
                onChange={(e) => setSettings({...settings, contactLabel: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">連絡先（番号・ID）</label>
              <input 
                type="text" 
                value={settings.contactValue}
                onChange={(e) => setSettings({...settings, contactValue: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 sticky bottom-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-pantore-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-pantore-700 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? '保存中...' : (
              <>
                <Save className="w-5 h-5" />
                設定を保存する
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}