"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, ChevronRight, X, Save, Trash2, Monitor, User,
  DollarSign, Calendar, Calculator, Package, FileText, Paperclip
} from 'lucide-react';

// モックデータ & 新しい型定義のインポート
import {
  OWNERSHIP_LABELS, ASSET_ACCESSORIES,
  type Asset, type AssetStatus, type OwnershipType,
  type UserSummary, type OrganizationSettings
} from '@/lib/types';
import {
  fetchAssetsAction,
  createAssetAction,
  updateAssetAction,
  deleteAssetAction
} from '@/app/actions/assets';
import { fetchUsersAction } from '@/app/actions/users';
import { fetchSettingsAction } from '@/app/actions/settings';
import { calculateAssetCosts } from '@/lib/cost-utils';

// --- Components (Badge) ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    in_use: 'bg-green-100 text-green-800 border-green-200',
    available: 'bg-blue-100 text-blue-800 border-blue-200',
    repair: 'bg-red-100 text-red-800 border-red-200',
    maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
    disposed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const labels: Record<string, string> = {
    in_use: '貸出中', available: '在庫あり', repair: '修理中', maintenance: 'メンテ中', disposed: '廃棄済',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

// --- Asset Modal ---
interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSave: (asset: Asset) => void;
  onDelete?: (id: string) => void;
  users: UserSummary[];
  settings: OrganizationSettings | null;
}

const AssetModal = ({ isOpen, onClose, asset, onSave, onDelete, users, settings }: AssetModalProps) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    managementId: '', serial: '', model: '', status: 'available',
    ownership: 'owned', purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0, monthlyCost: 0, months: 0, contractEndDate: '',
    depreciationMonths: 0, contractFile: '', // 🆕 追加
    userId: '',
    accessories: [], // 初期値
    note: ''
  });

  // モーダル表示時のデータセット
  useEffect(() => {
    if (isOpen) {
      if (asset) {
        setFormData({ ...asset, accessories: asset.accessories || [] });
      } else {
        setFormData({
          id: `TEMP_${Date.now()}`,
          managementId: '', serial: '', model: '', status: 'available',
          ownership: 'owned',
          purchaseDate: new Date().toISOString().split('T')[0],
          purchaseCost: 0, monthlyCost: 0, months: 0, contractEndDate: '',
          depreciationMonths: 0, contractFile: '', // 🆕 追加
          userId: null, userName: '-',
          accessories: ['充電アダプタ', '電源ケーブル'], // 新規作成時のデフォルト
          note: ''
        });
      }
    }
  }, [isOpen, asset]);

  // 付属品のトグル処理
  const toggleAccessory = (item: string) => {
    setFormData(prev => {
      const current = prev.accessories || [];
      const next = current.includes(item)
        ? current.filter(a => a !== item) // 削除
        : [...current, item]; // 追加
      return { ...prev, accessories: next };
    });
  };

  // 総額コストの自動計算
  const estimatedTotalCost = useMemo(() => {
    if (formData.ownership === 'owned') return formData.purchaseCost || 0;
    if (formData.ownership === 'lease' && formData.months && formData.monthlyCost) {
      return formData.months * formData.monthlyCost;
    }
    return 0;
  }, [formData.ownership, formData.purchaseCost, formData.monthlyCost, formData.months]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUser = users.find(u => u.id === formData.userId);
    const dataToSave = {
      ...formData,
      userName: selectedUser ? selectedUser.name : (formData.userId ? '不明なユーザー' : '-'),
      userId: formData.userId || null,
      purchaseCost: formData.ownership === 'owned' ? formData.purchaseCost : 0,
      monthlyCost: (formData.ownership === 'rental' || formData.ownership === 'lease') ? formData.monthlyCost : 0,
    } as Asset;
    onSave(dataToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {asset ? <Monitor className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            {asset ? '資産情報の編集' : '新規資産登録'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* 1. 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">管理番号 (Asset Tag)</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.managementId} onChange={(e) => setFormData({ ...formData, managementId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ステータス</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}>
                <option value="available">在庫 (Available)</option>
                <option value="in_use">貸出中 (In Use)</option>
                <option value="repair">修理中</option>
                <option value="maintenance">メンテ中</option>
                <option value="disposed">廃棄済</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">機種名 (Model)</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">シリアル番号 (S/N)</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                value={formData.serial} onChange={(e) => setFormData({ ...formData, serial: e.target.value })} />
            </div>
          </div>

          {/* 2. 契約・コスト情報エリア */}
          <div className="bg-pantore-50 p-5 rounded-xl border border-pantore-200 space-y-5">
            <h4 className="text-sm font-bold text-pantore-800 flex items-center gap-2 border-b border-pantore-200 pb-2">
              <DollarSign className="w-4 h-4" /> 調達・契約情報
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">所有形態</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  value={formData.ownership} onChange={(e) => setFormData({ ...formData, ownership: e.target.value as OwnershipType })}>
                  {(settings?.allowedOwnerships && settings.allowedOwnerships.length > 0
                    ? settings.allowedOwnerships
                    : ['owned', 'rental', 'lease', 'byod'] as OwnershipType[]
                  ).map(type => (
                    <option key={type} value={type}>{OWNERSHIP_LABELS[type]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 購入日 / 契約開始日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.ownership === 'owned' || formData.ownership === 'byod' ? '購入日 (Purchase Date)' : '契約開始日 (Contract Start)'}
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>



              {/* 返却日 (レンタルのみ) */}
              {formData.ownership === 'rental' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    返却日 (Return Date)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
                    value={formData.returnDate || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        returnDate: newDate,
                        status: newDate ? 'disposed' : prev.status
                      }));
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">返却が完了した日付を入力してください</p>
                </div>
              )}
            </div>

            {/* コスト入力 */}
            {formData.ownership === 'owned' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">購入金額</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input type="number" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.purchaseCost || ''} onChange={(e) => setFormData({ ...formData, purchaseCost: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                {/* 減価償却期間 (自社保有のみ) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    減価償却期間 (Depreciation)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500 pr-12"
                      value={formData.depreciationMonths || ''}
                      onChange={(e) => setFormData({ ...formData, depreciationMonths: parseInt(e.target.value) || undefined })}
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">ヶ月</span>
                  </div>
                </div>
              </div>
            )}

            {(formData.ownership === 'rental' || formData.ownership === 'lease') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">月額費用</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input type="number" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.monthlyCost || ''} onChange={(e) => setFormData({ ...formData, monthlyCost: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">契約月数 (Months)</label>
                  <div className="relative">
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="例: 12, 24"
                      value={formData.months || ''} onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) || undefined })} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">ヶ月</span>
                  </div>
                </div>
              </div>
            )}

            {formData.ownership !== 'byod' && (
              <div className="flex justify-end text-sm text-gray-600 pt-2 border-t border-pantore-200 border-dashed">
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  概算総コスト: <span className="font-bold text-lg text-pantore-700">
                    ¥{(() => {
                      if (formData.ownership === 'owned') {
                        return formData.purchaseCost?.toLocaleString() || '-';
                      }
                      if (formData.ownership === 'rental' || formData.ownership === 'lease') {
                        const monthly = formData.monthlyCost || 0;
                        if (formData.returnDate && formData.purchaseDate && formData.ownership === 'rental') {
                          const start = new Date(formData.purchaseDate);
                          const end = new Date(formData.returnDate);
                          let monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                          if (end.getDate() >= start.getDate()) monthsDiff += 1;
                          const actualMonths = Math.max(1, monthsDiff);
                          return (monthly * actualMonths).toLocaleString();
                        }
                        return formData.months ? (monthly * formData.months).toLocaleString() : '-';
                      }
                      return '-';
                    })()}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* 3. ユーザー割り当て */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" /> 現在の利用者
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              value={formData.userId || ''}
              onChange={(e) => {
                const newUserId = e.target.value;
                setFormData({
                  ...formData,
                  userId: newUserId,
                  status: newUserId ? 'in_use' : 'available'
                });
              }}
            >
              <option value="">(未割当 - 在庫)</option>
              <optgroup label="社員リスト">
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.branch || user.dept || '所属なし'})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. 🆕 付属品・備考エリア */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* 付属品 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4" /> 付属品 (Accessories)
              </label>
              <div className="flex flex-wrap gap-2">
                {ASSET_ACCESSORIES.map(item => {
                  const isSelected = formData.accessories?.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAccessory(item)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${isSelected
                          ? 'bg-pantore-500 text-white border-pantore-500 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                      `}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {item}
                    </button>
                  );
                })}
              </div>
              {/* 選択されたもののテキスト表示（確認用） */}
              {formData.accessories && formData.accessories.length > 0 && (
                <p className="text-xs text-pantore-600 mt-1">
                  選択中: {formData.accessories.join(', ')}
                </p>
              )}
            </div>

            {/* 契約書添付 (🆕 追加) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> 契約書・証憑 (Contract)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                  ファイルを選択
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, contractFile: file.name });
                      }
                    }}
                  />
                </label>
                {formData.contractFile ? (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm border border-blue-100">
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{formData.contractFile}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, contractFile: '' })}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">未添付</span>
                )}
              </div>
            </div>

            {/* メモ */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 備考・メモ (Notes)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500 resize-none bg-pantore-50/50"
                placeholder="例: マウスは故障したため情シスで保管済み / 画面に小さな傷あり"
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <div>
              {asset && onDelete && (
                <button type="button" onClick={() => { if (confirm('削除しますか？')) { onDelete(asset.id); onClose(); } }}
                  className="text-red-500 hover:bg-red-50 px-3 py-2 rounded text-sm flex items-center gap-1 transition-colors">
                  <Trash2 className="w-4 h-4" /> 削除
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">キャンセル</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2">
                <Save className="w-4 h-4" /> 保存する
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [costDisplayMode, setCostDisplayMode] = useState<'monthly' | 'total'>('monthly');

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [assetsData, usersData, settingsData] = await Promise.all([
          fetchAssetsAction(),
          fetchUsersAction(),
          fetchSettingsAction()
        ]);
        setAssets(assetsData);
        setUsers(usersData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const term = searchTerm.toLowerCase();
    return (
      asset.managementId.toLowerCase().includes(term) ||
      asset.model.toLowerCase().includes(term) ||
      (asset.userName && asset.userName.includes(term))
    );
  });

  const handleSave = async (savedAsset: Asset) => {
    try {
      if (editingAsset) {
        await updateAssetAction(savedAsset);
      } else {
        await createAssetAction(savedAsset);
      }
      // Reload assets
      const updatedAssets = await fetchAssetsAction();
      setAssets(updatedAssets);
      setIsModalOpen(false);
      alert('資産情報を保存しました！');
    } catch (error) {
      console.error('Failed to save asset:', error);
      alert('保存に失敗しました。');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssetAction(id);
      // Reload assets
      const updatedAssets = await fetchAssetsAction();
      setAssets(updatedAssets);
      alert('資産を削除しました。');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('削除に失敗しました。');
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AssetModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        asset={editingAsset} onSave={handleSave} onDelete={handleDelete}
        users={users}
        settings={settings}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">資産一覧</h2>
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button
              onClick={() => setCostDisplayMode('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${costDisplayMode === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              月額
            </button>
            <button
              onClick={() => setCostDisplayMode('total')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${costDisplayMode === 'total' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              総額
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="検索..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 font-medium">
            <Plus className="w-4 h-4" /> 資産登録
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">管理番号</th>
              <th className="px-6 py-3 font-medium text-gray-500">機種名</th>
              <th className="px-6 py-3 font-medium text-gray-500">所有形態</th>
              <th className="px-6 py-3 font-medium text-gray-500 text-right">コスト ({costDisplayMode === 'monthly' ? '月額' : '総額'})</th>
              <th className="px-6 py-3 font-medium text-gray-500">利用者</th>
              <th className="px-6 py-3 font-medium text-gray-500">ステータス</th>

              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }}
                className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="px-6 py-4 font-mono font-medium">{asset.managementId}</td>
                <td className="px-6 py-4 font-bold text-gray-700">{asset.model}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded border ${asset.ownership === 'rental' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    asset.ownership === 'lease' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      asset.ownership === 'owned' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                    {OWNERSHIP_LABELS[asset.ownership]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">
                  {(() => {
                    const { monthly, total } = calculateAssetCosts(asset);
                    if (costDisplayMode === 'monthly') {
                      return monthly > 0 ? `¥${monthly.toLocaleString()}/月` : '-';
                    } else {
                      return total > 0 ? `¥${total.toLocaleString()}` : '-';
                    }
                  })()}
                </td>
                <td className="px-6 py-4">
                  {asset.userName !== '-' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pantore-100 text-pantore-600 flex items-center justify-center text-xs font-bold">
                        {asset.userName?.charAt(0)}
                      </div>
                      <span>{asset.userName}</span>
                    </div>
                  ) : <span className="text-gray-300 text-xs">未割当</span>}
                </td>
                <td className="px-6 py-4"><StatusBadge status={asset.status} /></td>

                <td className="px-6 py-4 text-right">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}