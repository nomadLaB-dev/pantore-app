"use client";

import React, { useState } from 'react';
import { 
  Save, 
  Building2, 
  ShieldCheck, 
  Phone,
  Check
} from 'lucide-react';
import { MOCK_SETTINGS, OWNERSHIP_LABELS, type OwnershipType } from '@/lib/demo';

export default function SettingsPage() {
  const [settings, setSettings] = useState(MOCK_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // 保存処理のモック
    setTimeout(() => {
      setIsSaving(false);
      alert('設定を保存しました！✨\n(実際のDBにはまだ保存されません)');
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">組織設定</h2>
          <p className="text-sm text-gray-500 mt-1">Pantoreの利用ルールや連絡先を管理します</p>
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

        {/* 2. 資産ポリシー設定（SaaS化の肝！） */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-pantore-500" />
            資産管理ポリシー
          </h3>
          <p className="text-sm text-gray-500 mb-4">この組織で利用を許可するPCの調達・所有形態を選択してください。チェックを外すと、資産登録時の選択肢から消えます。</p>
          
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

        {/* 3. 緊急連絡先設定（脱・内線！） */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-pantore-500" />
            緊急連絡先・サポート
          </h3>
          <p className="text-sm text-gray-500 mb-4">ユーザー画面の「故障申請」などで表示される緊急連絡先です。</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ラベル（呼称）</label>
              <input 
                type="text" 
                placeholder="例: 情シス内線、Slack #helpdesk"
                value={settings.contactLabel}
                onChange={(e) => setSettings({...settings, contactLabel: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">連絡先（番号・ID）</label>
              <input 
                type="text" 
                placeholder="例: 03-1234-5678"
                value={settings.contactValue}
                onChange={(e) => setSettings({...settings, contactValue: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500 font-mono"
              />
            </div>
          </div>
          
          {/* プレビュー表示 */}
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 flex items-center gap-3">
            <div className="text-xs font-bold text-red-400 uppercase">Preview</div>
            <p className="text-sm text-red-600">
              緊急時は、申請後に <span className="font-bold">{settings.contactLabel}（{settings.contactValue}）</span> までご一報ください。
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-pantore-600 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-pantore-700 transition-all flex items-center gap-2 disabled:opacity-70"
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