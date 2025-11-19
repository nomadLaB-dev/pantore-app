"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  Filter,
  Monitor,
  Building2,
  MapPin,
  Briefcase,
  MoreHorizontal,
  ArrowLeft,
  Mail,
  User as UserIcon,
  X,
  Save
} from 'lucide-react';

// モックデータのインポート
import { 
  MOCK_USERS_LIST, 
  MOCK_USER_DETAIL_DATA, 
  type UserSummary,
  type UserDetail,
  type Role // Role型もインポート
} from '@/lib/demo';

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  
  const labels: Record<string, string> = {
    active: '在籍中',
    inactive: '退職済',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

// --- User Modal (Create/Edit) ---
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserSummary) => void;
}

const UserModal = ({ isOpen, onClose, onSave }: UserModalProps) => {
  // フォーム入力値を管理するState
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '親会社HD',
    dept: '',
    role: 'user'
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    // バリデーション（簡易）
    if (!formData.name || !formData.email) {
      alert('氏名とメールアドレスは必須です！😣');
      return;
    }

    // 新しいユーザーオブジェクトを作成
    const newUser: UserSummary = {
      id: `TEMP_${Date.now()}`, // 一時的なIDを発行
      name: formData.name,
      email: formData.email,
      company: formData.company,
      dept: formData.dept || '未配属',
      role: formData.role as Role,
      deviceCount: 0,
      status: 'active'
    };

    onSave(newUser);
    onClose();
    // フォームをリセット
    setFormData({ name: '', email: '', company: '親会社HD', dept: '', role: 'user' });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            ユーザー登録
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">氏名 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="例: 山田 太郎"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">メールアドレス <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="taro.yamada@pantore.jp"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">会社</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              >
                <option value="親会社HD">親会社HD</option>
                <option value="子会社テック">子会社テック</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">部署</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="例: 開発部"
                value={formData.dept}
                onChange={(e) => setFormData({...formData, dept: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">キャンセル</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" /> 保存する
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function UsersPage() {
  // State
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🆕 ユーザーリストをStateで管理（初期値はdemo.tsのデータ）
  const [users, setUsers] = useState<UserSummary[]>(MOCK_USERS_LIST);

  // Mock Data (詳細表示時は常に鈴木さんのデータを表示するデモ仕様)
  // ※本来は users から該当ユーザーを探して表示すべき
  const userDetail: UserDetail = MOCK_USER_DETAIL_DATA;

  // Handlers
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUserId(null);
  };

  const handleSaveUser = (newUser: UserSummary) => {
    // Stateを更新して一覧に追加（画面上即座に反映されます！）
    setUsers([...users, newUser]);
    alert(`ユーザー「${newUser.name}」さんを追加しました！🎉\n(リロードすると消えます)`);
  };

  // --- Views ---

  const UserListView = () => {
    // Stateの users を使ってフィルタリング
    const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.dept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">ユーザー一覧</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="名前, メール, 部署..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> フィルター
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" /> ユーザー登録
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">氏名 / メール</th>
                <th className="px-6 py-3 font-medium text-gray-500">所属 (会社/部署)</th>
                <th className="px-6 py-3 font-medium text-gray-500">役割</th>
                <th className="px-6 py-3 font-medium text-gray-500">利用デバイス数</th>
                <th className="px-6 py-3 font-medium text-gray-500">ステータス</th>
                <th className="px-6 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  onClick={() => handleUserClick(user.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div>
                        <p className="font-medium text-gray-700">{user.company}</p>
                        <p className="text-xs text-gray-500">{user.dept}</p>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="inline-block px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     {user.deviceCount > 0 ? (
                       <div className="flex items-center gap-1 text-blue-600 font-medium">
                         <Monitor className="w-4 h-4" />
                         {user.deviceCount}台
                       </div>
                     ) : (
                       <span className="text-gray-400">なし</span>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                     ユーザーが見つかりません 👻
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const UserDetailView = () => {
    // 実際は selectedUserId を使ってデータをFetchするが、今回はモックを使用
    const user = userDetail;

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        {/* Breadcrumb / Back Button */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button 
            onClick={handleBackToList}
            className="hover:text-blue-600 hover:underline flex items-center gap-1 transition-colors"
          >
             <ArrowLeft className="w-4 h-4" /> 
             ユーザー一覧
          </button>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="font-medium text-gray-800">詳細 ({user.name})</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                        {user.role}
                      </span>
                      <StatusBadge status={user.status} />
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  現在利用中のデバイス
                </h3>
                
                {user.currentDevice ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 group cursor-pointer hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <Monitor className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-blue-900">{user.currentDevice.model}</p>
                        <p className="text-xs text-blue-700 font-mono">{user.currentDevice.serial}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2 text-right font-medium">
                      貸出日: {user.currentDevice.assignedAt}
                    </p>
                  </div>
                ) : (
                   <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
                     利用中のデバイスはありません
                   </div>
                )}

                <button className="w-full mt-3 text-xs text-blue-600 flex items-center justify-center gap-1 hover:underline py-2 rounded hover:bg-blue-50 transition-colors">
                  <Plus className="w-3 h-3" /> デバイスを追加貸出
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-blue-500" />
                所属履歴タイムライン
              </h3>
              <button className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                <Plus className="w-3 h-3" /> 履歴を追加
              </button>
            </div>

            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pl-8 py-2">
              {user.history.map((item, index) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`
                    absolute -left-[39px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10
                    ${index === 0 ? 'bg-green-500 ring-2 ring-green-100' : 'bg-gray-300 group-hover:bg-gray-400'}
                    transition-colors
                  `}></div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors -mt-2">
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{item.company}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.branch} - {item.dept}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.position}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm whitespace-nowrap">
                      {item.startDate} 〜 {item.endDate || '現在'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser}
      />
      
      {viewMode === 'list' ? <UserListView /> : <UserDetailView />}
    </>
  );
}