"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  CheckSquare,
  X,
  Save,
  Trash2,
  Monitor,
  User,
  DollarSign
} from 'lucide-react';

// モックデータのインポート
import { 
  MOCK_ASSETS, 
  MOCK_USERS_LIST, 
  type Asset, 
  type AssetStatus 
} from '@/lib/demo';

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    in_use: 'bg-green-100 text-green-800 border-green-200',
    available: 'bg-blue-100 text-blue-800 border-blue-200',
    repair: 'bg-red-100 text-red-800 border-red-200',
    maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
    disposed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  
  const labels: Record<string, string> = {
    in_use: '貸出中',
    available: '在庫あり',
    repair: '修理中',
    maintenance: 'メンテ中',
    disposed: '廃棄済',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

// --- Modal Component ---

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null; // nullなら新規登録モード
  onSave: (asset: Asset) => void;
  onDelete?: (id: string) => void;
}

const AssetModal = ({ isOpen, onClose, asset, onSave, onDelete }: AssetModalProps) => {
  // フォームの状態管理
  const [formData, setFormData] = useState<Partial<Asset>>({
    managementId: '',
    serial: '',
    model: '',
    status: 'available',
    purchaseDate: new Date().toISOString().split('T')[0], // 今日の日付
    isRental: true,
    monthlyCost: 0,
    userId: '',
    note: ''
  });

  // モーダルが開くとき、編集ならデータを入れる、新規ならリセット
  useEffect(() => {
    if (isOpen) {
      if (asset) {
        setFormData({ ...asset });
      } else {
        setFormData({
          id: `TEMP_${Date.now()}`, // 仮ID
          managementId: '',
          serial: '',
          model: '',
          status: 'available',
          purchaseDate: new Date().toISOString().split('T')[0],
          isRental: true,
          monthlyCost: 0,
          userId: null, // nullに戻す
          userName: '-',
          note: ''
        });
      }
    }
  }, [isOpen, asset]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ユーザー名の補完（本来はDB結合だけど、ここではリストから検索してセット）
    const selectedUser = MOCK_USERS_LIST.find(u => u.id === formData.userId);
    const dataToSave = {
      ...formData,
      userName: selectedUser ? selectedUser.name : (formData.userId ? '不明なユーザー' : '-'),
      userId: formData.userId || null, // 空文字ならnullに
      monthlyCost: formData.isRental ? formData.monthlyCost : 0 // レンタルでなければ0円に
    } as Asset;
    
    onSave(dataToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {asset ? <Monitor className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            {asset ? '資産情報の編集' : '新規資産登録'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Form) */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">管理番号 (Asset Tag)</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: PC-24-001"
                  value={formData.managementId}
                  onChange={(e) => setFormData({...formData, managementId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">シリアル番号 (S/N)</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="例: C02XXXXXXX"
                  value={formData.serial}
                  onChange={(e) => setFormData({...formData, serial: e.target.value})}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">機種名 (Model)</label>
              <input 
                required
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: MacBook Pro 14-inch (M3 Pro)"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ステータス</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as AssetStatus})}
                >
                  <option value="available">在庫 (Available)</option>
                  <option value="in_use">貸出中 (In Use)</option>
                  <option value="repair">修理中</option>
                  <option value="maintenance">メンテ中</option>
                  <option value="disposed">廃棄済</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">調達日</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                />
              </div>
               <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={formData.isRental}
                      onChange={(e) => setFormData({...formData, isRental: e.target.checked})}
                    />
                    <div className={`w-5 h-5 border-2 rounded transition-all ${formData.isRental ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}></div>
                    <CheckSquare className={`w-3.5 h-3.5 text-white absolute left-0.5 top-0.5 transition-opacity ${formData.isRental ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">レンタル品</span>
                </label>
              </div>
            </div>
            
            {/* Row 3.5: Monthly Cost (Conditional) */}
            {formData.isRental && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  月額利用料
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input 
                    type="number"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15000"
                    value={formData.monthlyCost || ''}
                    onChange={(e) => setFormData({...formData, monthlyCost: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            )}

            {/* Row 4: User Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                現在の利用者
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formData.userId || ''}
                onChange={(e) => setFormData({...formData, userId: e.target.value})}
              >
                <option value="">(未割当 - 在庫)</option>
                <optgroup label="社員リスト">
                  {MOCK_USERS_LIST.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.dept})
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-xs text-gray-500">※「貸出中」にする場合は必ず選択してください</p>
            </div>

            {/* Row 5 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">備考 (Notes)</label>
              <textarea 
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="付属品や特記事項があれば入力..."
                value={formData.note || ''}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            {/* 編集モード時のみ削除ボタンを表示 */}
            <div>
              {asset && onDelete && (
                <button 
                  type="button"
                  onClick={() => {
                    if (confirm('本当にこの資産データを削除してもよろしいですか？')) {
                      onDelete(asset.id);
                      onClose();
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> 削除
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存する
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
  // モックデータをStateとして持つ（実際はDBからFetch）
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // 検索フィルター処理
  const filteredAssets = assets.filter((asset) => {
    const term = searchTerm.toLowerCase();
    return (
      asset.managementId.toLowerCase().includes(term) ||
      asset.serial.toLowerCase().includes(term) ||
      asset.model.toLowerCase().includes(term) ||
      (asset.userName && asset.userName.includes(term))
    );
  });

  // Handlers
  const handleCreate = () => {
    setEditingAsset(null); // 新規モード
    setIsModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset); // 編集モード
    setIsModalOpen(true);
  };

  const handleSave = (savedAsset: Asset) => {
    if (editingAsset) {
      // 更新処理 (Mock)
      setAssets(assets.map(a => a.id === savedAsset.id ? savedAsset : a));
      alert(`資産「${savedAsset.managementId}」を更新しました！✨`);
    } else {
      // 新規登録処理 (Mock)
      setAssets([...assets, savedAsset]);
      alert(`資産「${savedAsset.managementId}」を新規登録しました！🎉`);
    }
  };

  const handleDelete = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
    alert('資産データを削除しました🗑️');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* モーダルコンポーネントの配置 */}
      <AssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        asset={editingAsset}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Header Area */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">資産一覧</h2>
          <p className="text-sm text-gray-500 mt-1">管理中のPCデバイス一覧です</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="管理番号, シリアル, ユーザー名..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 資産登録
          </button>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 w-32">管理番号</th>
              <th className="px-6 py-3 font-medium text-gray-500">機種名</th>
              <th className="px-6 py-3 font-medium text-gray-500">シリアル</th>
              <th className="px-6 py-3 font-medium text-gray-500 text-center w-20">レンタル</th>
              <th className="px-6 py-3 font-medium text-gray-500 text-right">月額利用料</th>
              <th className="px-6 py-3 font-medium text-gray-500">現在の利用者</th>
              <th className="px-6 py-3 font-medium text-gray-500">ステータス</th>
              <th className="px-6 py-3 font-medium text-gray-500">調達日</th>
              <th className="px-6 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssets.map((asset) => (
              <tr 
                key={asset.id} 
                onClick={() => handleEdit(asset)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-gray-700 font-medium">
                  {asset.managementId}
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">
                  {asset.model}
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                  {asset.serial}
                </td>
                <td className="px-6 py-4 text-center">
                  {asset.isRental && (
                    <span className="inline-flex items-center justify-center text-blue-600" title="レンタル品">
                      <CheckSquare className="w-5 h-5" />
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {asset.isRental ? `¥${(asset.monthlyCost || 0).toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4">
                  {asset.userName !== '-' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {asset.userName?.charAt(0)}
                      </div>
                      <span className="text-gray-700">{asset.userName}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs pl-2">未割当</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={asset.status} />
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                  {asset.purchaseDate}
                </td>
                <td className="px-6 py-4 text-right">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </td>
              </tr>
            ))}
            
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                  条件に一致する資産は見つかりませんでした 😢
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}