"use client";

import React, { useState, useEffect } from 'react';
import {
  Save,
  Building2,
  ShieldCheck,
  Phone,
  Check,
  List,
  X,
  Plus,
  Link as LinkIcon,
  Copy,
  RefreshCw
} from 'lucide-react';
import {
  OWNERSHIP_LABELS,
  type OwnershipType,
  type MasterData,
  type OrganizationSettings
} from '@/lib/types';
import {
  fetchSettingsAction,
  updateSettingsAction,
  fetchMasterDataAction,
  updateMasterDataAction
} from '@/app/actions/settings';
import {
  createInvitationAction,
  getActiveInvitationAction
} from '@/app/actions/invitations';

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

  // Deduplicate items to prevent React key warnings
  const uniqueItems = Array.from(new Set(items));

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-700">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {uniqueItems.map(item => (
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
  const [settings, setSettings] = useState<OrganizationSettings>({
    id: '',
    name: '',
    allowedOwnerships: [],
    contactLabel: '',
    contactValue: ''
  });
  const [masterData, setMasterData] = useState<MasterData>({
    companies: [],
    departments: [],
    branches: []
  });
  const [invitation, setInvitation] = useState<{ token: string; email_domain: string | null } | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, masterDataData, inviteData] = await Promise.all([
          fetchSettingsAction(),
          fetchMasterDataAction(),
          getActiveInvitationAction()
        ]);

        if (settingsData) setSettings(settingsData);
        if (masterDataData) setMasterData(masterDataData);
        if (inviteData) {
          setInvitation(inviteData);
          setDomainInput(inviteData.email_domain || '');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    // ... (remains the same)
    e.preventDefault();
    setIsSaving(true);

    try {
      await Promise.all([
        updateSettingsAction(settings),
        updateMasterDataAction(masterData)
      ]);
      alert('設定を保存し、マスタデータを更新しました！✨');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!confirm('新しい招待リンクを発行しますか？\n（古いリンクは無効にはなりませんが、新しいリンクがメインになります）')) return;

    setIsGeneratingInvite(true);
    try {
      const token = await createInvitationAction(domainInput || undefined);
      setInvitation({ token, email_domain: domainInput || null });
      alert('招待リンクを発行しました！');
    } catch (e) {
      console.error(e);
      alert('発行に失敗しました');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!invitation) return;
    const url = `${window.location.origin}/join/${invitation.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOwnership = (type: OwnershipType) => {
    // ... (remains the same)
    setSettings(prev => {
      const current = prev.allowedOwnerships;
      const next = current.includes(type)
        ? current.filter(t => t !== type) // 削除
        : [...current, type]; // 追加
      return { ...prev, allowedOwnerships: next };
    });
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">読み込み中...</div>;
  }

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
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
              />
            </div>
          </div>
        </div>

        {/* 🆕 招待リンク管理 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-pantore-500" />
            招待リンク
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            メンバーを招待するための共有リンクを発行します。このURLを知っているユーザーは誰でも参加できます。
          </p>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-bold text-gray-700">メールドメイン制限（任意）</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">@</span>
                  <input
                    type="text"
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
                  />
                </div>
                <p className="text-xs text-gray-400">指定した場合、そのドメインのメールアドレス以外は登録できなくなります。</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={isGeneratingInvite}
                className="bg-pantore-100 text-pantore-700 font-bold py-2 px-4 rounded-lg hover:bg-pantore-200 transition-colors flex items-center gap-2 h-10 whitespace-nowrap"
              >
                {isGeneratingInvite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                リンクを発行
              </button>
            </div>

            {invitation && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full overflow-hidden">
                  <p className="text-xs text-gray-500 mb-1 font-bold">招待用URL</p>
                  <p className="text-sm text-gray-800 font-mono truncate bg-white p-2 rounded border border-gray-200 select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/join/${invitation.token}` : `.../join/${invitation.token}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all w-full md:w-auto justify-center
                    ${copied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}
                  `}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'コピーしました' : 'URLをコピー'}
                </button>
              </div>
            )}
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
              onUpdate={(items) => setMasterData({ ...masterData, companies: items })}
            />
            <MasterEditor
              title="拠点リスト"
              items={masterData.branches}
              onUpdate={(items) => setMasterData({ ...masterData, branches: items })}
            />
            <MasterEditor
              title="部署リスト"
              items={masterData.departments}
              onUpdate={(items) => setMasterData({ ...masterData, departments: items })}
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
                onChange={(e) => setSettings({ ...settings, contactLabel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">連絡先（番号・ID）</label>
              <input
                type="text"
                value={settings.contactValue}
                onChange={(e) => setSettings({ ...settings, contactValue: e.target.value })}
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