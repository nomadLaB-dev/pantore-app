"use client";

import React, { useState, Dispatch, SetStateAction } from 'react';
import { X, Mail, Monitor, Plus, Building2, MapPin, Briefcase, MoreHorizontal, CheckCircle2, Ban } from 'lucide-react';
import { 
  type UserSummary, type UserDetail, type Asset, 
  type EmploymentHistory, type DeviceHistory,
  type UserStatus,
  MOCK_USER_DETAIL_DATA 
} from '@/lib/demo';
import { HistoryModal } from './HistoryModal';
import { DeviceAssignModal } from './DeviceAssignModal';

interface Props {
  initialUser: UserSummary;
  onClose: () => void;
  onUpdateUser: (user: UserSummary) => void; // 🆕 ステータス更新用
  assets: Asset[];
  setAssets: Dispatch<SetStateAction<Asset[]>>;
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    return <span className={`px-2 py-0.5 rounded text-xs border ${styles[status]}`}>{status === 'active' ? '在籍中' : '退職済'}</span>;
};

export const UserDetailModal = ({ initialUser, onClose, onUpdateUser, assets, setAssets }: Props) => {
  const [userDetail, setUserDetail] = useState<UserDetail>(() => {
    const deviceAsset = assets.find(a => a.userId === initialUser.id);
    const currentDevice = deviceAsset ? {
        model: deviceAsset.model,
        serial: deviceAsset.serial,
        assignedAt: deviceAsset.purchaseDate
    } : null;
    
    return {
      ...initialUser,
      currentDevice,
      history: initialUser.id === 'U000' ? MOCK_USER_DETAIL_DATA.history : []
    };
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false); // ステータス変更メニュー用

  // ステータス変更ロジック
  const handleStatusChange = (newStatus: UserStatus) => {
      const updatedUser = { ...userDetail, status: newStatus };
      setUserDetail(updatedUser); // ローカル更新
      onUpdateUser(updatedUser); // 親データ更新
      setIsStatusMenuOpen(false);
  };

  const handleAddHistory = (newHistory: EmploymentHistory) => {
    let updatedHistory = [...userDetail.history];
    const currentIdx = updatedHistory.findIndex(h => h.endDate === null);
    if (currentIdx !== -1) {
      const endDate = new Date(newHistory.startDate);
      endDate.setDate(endDate.getDate() - 1);
      updatedHistory[currentIdx] = { ...updatedHistory[currentIdx], endDate: endDate.toISOString().split('T')[0] };
    }
    setUserDetail(prev => ({ ...prev, history: [newHistory, ...updatedHistory] }));
  };

  const handleAssignDevice = (newDevice: DeviceHistory, assetId: string) => {
    setUserDetail(prev => ({ ...prev, currentDevice: newDevice }));
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'in_use', userId: userDetail.id, userName: userDetail.name } : a));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end md:justify-center p-4 md:p-8 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onSave={handleAddHistory} />
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
               <p className="text-sm text-gray-500 mt-1">{userDetail.role} / {userDetail.email}</p>
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
                 {userDetail.currentDevice ? (
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <p className="font-bold text-blue-900">{userDetail.currentDevice.model}</p>
                     <p className="text-xs text-blue-600 font-mono">{userDetail.currentDevice.serial}</p>
                     <p className="text-xs text-blue-500 mt-1 text-right">{userDetail.currentDevice.assignedAt}〜</p>
                   </div>
                 ) : <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded">なし</div>}
                 <button onClick={() => setIsDeviceOpen(true)} className="w-full mt-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-1 transition-colors"><Plus className="w-4 h-4" /> 貸出</button>
               </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> 所属履歴</h3>
                 <button onClick={() => setIsHistoryOpen(true)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 flex items-center gap-1 font-bold"><Plus className="w-3 h-3" /> 追加</button>
               </div>
               <div className="space-y-8 border-l-2 border-gray-100 ml-2 pl-6 py-2">
                 {userDetail.history.length > 0 ? userDetail.history.map((h, i) => (
                   <div key={h.id} className="relative group">
                     <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${i===0 && !h.endDate ? 'bg-green-500 ring-2 ring-green-100' : 'bg-gray-300'}`}></div>
                     <div>
                       <h4 className="font-bold text-gray-800">{h.company}</h4>
                       <p className="text-sm text-gray-600 mt-1">{h.branch} - {h.dept} <span className="text-gray-400">/</span> {h.position}</p>
                       <p className="text-xs text-gray-400 font-mono mt-1">{h.startDate} 〜 {h.endDate || '現在'}</p>
                     </div>
                   </div>
                 )) : <p className="text-gray-400 text-sm">履歴情報がありません</p>}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};