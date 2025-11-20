"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, ChevronRight, X, Save, Trash2, Monitor, User, 
  DollarSign, Calendar, Calculator, Package, FileText
} from 'lucide-react';

// モックデータ & 新しい型定義のインポート
import { 
  MOCK_ASSETS, MOCK_USERS_LIST, MOCK_SETTINGS, OWNERSHIP_LABELS, ASSET_ACCESSORIES,
  type Asset, type AssetStatus, type OwnershipType
} from '@/lib/demo';

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
}

const AssetModal = ({ isOpen, onClose, asset, onSave, onDelete }: AssetModalProps) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    managementId: '', serial: '', model: '', status: 'available',
    ownership: 'owned', purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0, monthlyCost: 0, months: 0, contractEndDate: '',
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
    const selectedUser = MOCK_USERS_LIST.find(u => u.id === formData.userId);
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
                value={formData.managementId} onChange={(e) => setFormData({...formData, managementId: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ステータス</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as AssetStatus})}>
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
                value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">シリアル番号 (S/N)</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                value={formData.serial} onChange={(e) => setFormData({...formData, serial: e.target.value})} />
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
                  value={formData.ownership} onChange={(e) => setFormData({...formData, ownership: e.target.value as OwnershipType})}>
                  {MOCK_SETTINGS.allowedOwnerships.map(type => (
                    <option key={type} value={type}>{OWNERSHIP_LABELS[type]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {formData.ownership === 'rental' || formData.ownership === 'lease' ? '契約開始日' : '購入日'}
                </label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.purchaseDate} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})} />
              </div>
            </div>

            {/* コスト入力 */}
             {formData.ownership === 'owned' && (
               <div className="space-y-2 animate-in fade-in">
                 <label className="text-sm font-medium text-gray-700">購入金額</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                   <input type="number" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                     value={formData.purchaseCost || ''} onChange={(e) => setFormData({...formData, purchaseCost: parseInt(e.target.value) || 0})} />
                 </div>
               </div>
            )}

            {(formData.ownership === 'rental' || formData.ownership === 'lease') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">月額費用</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input type="number" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.monthlyCost || ''} onChange={(e) => setFormData({...formData, monthlyCost: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                {formData.ownership === 'lease' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">契約月数</label>
                    <div className="relative">
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={formData.months || ''} onChange={(e) => setFormData({...formData, months: parseInt(e.target.value) || 0})} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">ヶ月</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">契約終了日</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={formData.contractEndDate || ''} onChange={(e) => setFormData({...formData, contractEndDate: e.target.value})} />
                </div>
              </div>
            )}

            {formData.ownership !== 'byod' && estimatedTotalCost > 0 && (
               <div className="flex justify-end text-sm text-gray-600 pt-2 border-t border-pantore-200 border-dashed">
                 <span className="flex items-center gap-2">
                   <Calculator className="w-4 h-4" />
                   概算総コスト: <span className="font-bold text-lg text-pantore-700">¥{estimatedTotalCost.toLocaleString()}</span>
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
              value={formData.userId || ''} onChange={(e) => setFormData({...formData, userId: e.target.value})}>
              <option value="">(未割当 - 在庫)</option>
              <optgroup label="社員リスト">
                {MOCK_USERS_LIST.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.dept})</option>
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
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
             <div>
               {asset && onDelete && (
                 <button type="button" onClick={() => { if(confirm('削除しますか？')) { onDelete(asset.id); onClose(); } }}
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
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter((asset) => {
    const term = searchTerm.toLowerCase();
    return (
      asset.managementId.toLowerCase().includes(term) ||
      asset.model.toLowerCase().includes(term) ||
      (asset.userName && asset.userName.includes(term))
    );
  });

  const handleSave = (savedAsset: Asset) => {
    if (editingAsset) {
      setAssets(assets.map(a => a.id === savedAsset.id ? savedAsset : a));
    } else {
      setAssets([...assets, savedAsset]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AssetModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        asset={editingAsset} onSave={handleSave} onDelete={handleDelete}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">資産一覧</h2>
        <div className="flex gap-2">
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
              <th className="px-6 py-3 font-medium text-gray-500 text-right">コスト(月額/総額)</th>
              <th className="px-6 py-3 font-medium text-gray-500">利用者</th>
              <th className="px-6 py-3 font-medium text-gray-500">ステータス</th>
              <th className="px-6 py-3 font-medium text-gray-500">期限</th>
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
                   <span className={`text-xs px-2 py-1 rounded border ${
                     asset.ownership === 'rental' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                     asset.ownership === 'lease' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                     asset.ownership === 'owned' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                     'bg-gray-50 text-gray-600 border-gray-100'
                   }`}>
                     {OWNERSHIP_LABELS[asset.ownership]}
                   </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">
                  {asset.ownership === 'rental' || asset.ownership === 'lease' 
                    ? `¥${(asset.monthlyCost || 0).toLocaleString()}/月`
                    : asset.ownership === 'owned' 
                    ? `¥${(asset.purchaseCost || 0).toLocaleString()}`
                    : '-'}
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
                <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                  {asset.contractEndDate || asset.purchaseDate}
                </td>
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