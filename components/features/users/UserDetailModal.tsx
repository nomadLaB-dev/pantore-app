"use client";

import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { X, Monitor, Plus, Building2, MoreHorizontal, CheckCircle2, Ban, Pencil, Trash2 } from 'lucide-react';
import {
  type UserSummary, type UserDetail, type Asset,
  type EmploymentHistory, type DeviceHistory,
  type UserStatus
} from '@/lib/types';
import { HistoryModal } from './HistoryModal';
import { DeviceAssignModal } from './DeviceAssignModal';
import {
  fetchUserDetailAction,
  updateUserAction,
  createEmploymentHistoryAction,
  updateEmploymentHistoryAction,
  deleteEmploymentHistoryAction
} from '@/app/actions/users';
import { assignAssetToUserAction } from '@/app/actions/assets';

interface Props {
  initialUser: UserSummary;
  onClose: () => void;
  onUpdateUser: (user: UserSummary) => void;
  assets: Asset[];
  setAssets: Dispatch<SetStateAction<Asset[]>>;
  currentUserRole: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return <span className={`px-2 py-0.5 rounded text-xs border ${styles[status]}`}>{status === 'active' ? '在籍中' : '退職済'}</span>;
};

export const UserDetailModal = ({ initialUser, onClose, onUpdateUser, assets, setAssets, currentUserRole }: Props) => {
  const [userDetail, setUserDetail] = useState<UserDetail>({
    ...initialUser,
    currentDevice: null,
    history: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<EmploymentHistory | null>(null);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  // Fetch detailed data
  useEffect(() => {
    const loadDetail = async () => {
      try {
        const detail = await fetchUserDetailAction(initialUser.id);
        if (detail) {
          setUserDetail(detail);
        }
      } catch (error) {
        console.error('Failed to load user detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [initialUser.id]);

  // ステータス変更ロジック
  const handleStatusChange = (newStatus: UserStatus) => {
    const updatedUser = { ...userDetail, status: newStatus };
    setUserDetail(updatedUser); // ローカル更新
    onUpdateUser(updatedUser); // 親データ更新 (Server Action is called in parent)
    setIsStatusMenuOpen(false);
  };

  const handleSaveHistory = async (historyData: EmploymentHistory) => {
    try {
      if (editingHistory) {
        // Update
        await updateEmploymentHistoryAction({ ...historyData, id: editingHistory.id });
        alert('所属履歴を更新しました！');
      } else {
        // Create
        await createEmploymentHistoryAction({ ...historyData, userId: userDetail.id });
        alert('所属履歴を追加しました！');
      }

      // Reload detail
      const detail = await fetchUserDetailAction(userDetail.id);
      if (detail) setUserDetail(detail);

      setEditingHistory(null);
    } catch (error) {
      console.error('Failed to save history:', error);
      alert('履歴の保存に失敗しました。');
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!confirm('この履歴を削除しますか？')) return;
    try {
      await deleteEmploymentHistoryAction(historyId);
      // Reload detail
      const detail = await fetchUserDetailAction(userDetail.id);
      if (detail) setUserDetail(detail);
      alert('履歴を削除しました。');
    } catch (error) {
      console.error('Failed to delete history:', error);
      alert('履歴の削除に失敗しました。');
    }
  };

  const handleAssignDevice = async (newDevice: DeviceHistory, assetId: string) => {
    try {
      // Update Asset in DB
      await assignAssetToUserAction(assetId, userDetail.id);

      // Update local assets state (optimistic or reload)
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'in_use', userId: userDetail.id, userName: userDetail.name } : a));

      // Reload detail
      const detail = await fetchUserDetailAction(userDetail.id);
      if (detail) setUserDetail(detail);

      alert('デバイスを割り当てました！');
    } catch (error) {
      console.error('Failed to assign device:', error);
      alert('デバイスの割り当てに失敗しました。');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end md:justify-center p-4 md:p-8 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => { setIsHistoryOpen(false); setEditingHistory(null); }}
        onSave={handleSaveHistory}
        initialData={editingHistory}
      />
      <DeviceAssignModal isOpen={isDeviceOpen} onClose={() => setIsDeviceOpen(false)} onSave={handleAssignDevice} assets={assets} />

      <div className="bg-white w-full max-w-5xl h-full md:h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-8 duration-300">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
              {userDetail.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">{userDetail.name}</h2>

                {/* ステータス変更ドロップダウン */}
                <div className="relative">
                  <button
                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <StatusBadge status={userDetail.status} />
                  </button>
                  {isStatusMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                      <button
                        onClick={() => handleStatusChange('active')}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-emerald-50 text-emerald-700"
                      >
                        <CheckCircle2 className="w-4 h-4" /> 在籍中 (Active)
                      </button>
                      <button
                        onClick={() => handleStatusChange('inactive')}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 text-gray-600"
                      >
                        <Ban className="w-4 h-4" /> 退職済 (Inactive)
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">{userDetail.email}</p>
                <span className="text-gray-300">/</span>
                <div className="relative group/role">
                  <button className={`text-sm font-medium flex items-center gap-1 transition-colors ${(currentUserRole === 'owner' || (currentUserRole === 'admin' && userDetail.role !== 'owner'))
                    ? 'text-gray-500 hover:text-blue-600 cursor-pointer'
                    : 'text-gray-500 cursor-default'
                    }`}>
                    {userDetail.role === 'owner' ? '所有者 (Owner)' : userDetail.role === 'admin' ? '管理者 (Admin)' : '一般 (User)'}
                    {(currentUserRole === 'owner' || (currentUserRole === 'admin' && userDetail.role !== 'owner')) && (
                      <MoreHorizontal className="w-3 h-3" />
                    )}
                  </button>

                  {/* Role Selection Menu */}
                  {(currentUserRole === 'owner' || (currentUserRole === 'admin' && userDetail.role !== 'owner')) && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover/role:block z-20">
                      {currentUserRole === 'owner' && (
                        <button
                          onClick={() => {
                            const updated = { ...userDetail, role: 'owner' as const };
                            setUserDetail(updated);
                            onUpdateUser(updated);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 text-purple-700"
                        >
                          所有者 (Owner)
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const updated = { ...userDetail, role: 'admin' as const };
                          setUserDetail(updated);
                          onUpdateUser(updated);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-700"
                      >
                        管理者 (Admin)
                      </button>
                      <button
                        onClick={() => {
                          const updated = { ...userDetail, role: 'member' as const };
                          setUserDetail(updated);
                          onUpdateUser(updated);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                      >
                        一般 (User)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Monitor className="w-4 h-4" /> 利用デバイス</h3>
                <div className="space-y-3">
                  {assets.filter(a => a.userId === userDetail.id).length > 0 ? (
                    assets.filter(a => a.userId === userDetail.id).map(asset => (
                      <div key={asset.id} className="bg-blue-50 p-4 rounded-lg border border-blue-100 relative group">
                        <p className="font-bold text-blue-900">{asset.model}</p>
                        <p className="text-xs text-blue-600 font-mono">{asset.serial}</p>
                        <p className="text-xs text-blue-500 mt-1 text-right">{asset.purchaseDate}〜</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded">なし</div>
                  )}
                </div>
                <button onClick={() => setIsDeviceOpen(true)} className="w-full mt-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-1 transition-colors"><Plus className="w-4 h-4" /> 貸出</button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> 所属履歴</h3>
                <button onClick={() => { setEditingHistory(null); setIsHistoryOpen(true); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 flex items-center gap-1 font-bold"><Plus className="w-3 h-3" /> 追加</button>
              </div>
              <div className="space-y-8 border-l-2 border-gray-100 ml-2 pl-6 py-2">
                {userDetail.history.length > 0 ? userDetail.history.map((h, i) => (
                  <React.Fragment key={h.id}>
                    {/* Insert Button */}
                    <div
                      className="h-6 -my-3 flex items-center justify-center z-10 relative group/insert cursor-pointer"
                      onClick={() => { setEditingHistory(null); setIsHistoryOpen(true); }}
                      title="この期間に履歴を挿入"
                    >
                      <div className="w-full h-px bg-blue-200 absolute"></div>
                      <div className="bg-white text-blue-600 rounded-full p-1 border border-blue-200 relative z-10 shadow-sm transform scale-75 group-hover/insert:scale-100 transition-transform">
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="relative group py-2">
                      <div className={`absolute -left-[31px] top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm ${i === 0 && !h.endDate ? 'bg-green-500 ring-2 ring-green-100' : 'bg-gray-300'}`}></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800">{h.company}</h4>
                          <p className="text-sm text-gray-600 mt-1">{h.branch} - {h.dept} <span className="text-gray-400">/</span> {h.position}</p>
                          <p className="text-xs text-gray-400 font-mono mt-1">{h.startDate} 〜 {h.endDate || '現在'}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingHistory(h); setIsHistoryOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="編集"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(h.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )) : <p className="text-gray-400 text-sm">履歴情報がありません</p>}

                {/* Always show insert button at the bottom */}
                <div
                  className="h-6 -my-3 flex items-center justify-center z-10 relative group/insert cursor-pointer"
                  onClick={() => { setEditingHistory(null); setIsHistoryOpen(true); }}
                  title="この期間に履歴を挿入"
                >
                  <div className="w-full h-px bg-blue-200 absolute"></div>
                  <div className="bg-white text-blue-600 rounded-full p-1 border border-blue-200 relative z-10 shadow-sm transform scale-75 group-hover/insert:scale-100 transition-transform">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};