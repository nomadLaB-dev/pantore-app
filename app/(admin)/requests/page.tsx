"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  FileText,
  Plus,
  AlertCircle,
  ArrowRightLeft,
  MessageSquare,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// モックデータのインポート
import { 
  MOCK_REQUESTS, 
  type Request, 
  type RequestStatus 
} from '@/lib/demo';

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    rejected: 'bg-red-50 text-red-600 border-red-100',
  };
  
  const labels: Record<string, string> = {
    pending: '承認待ち',
    approved: '手配中',
    completed: '完了',
    rejected: '却下',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

const RequestTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'new_hire': return <Plus className="w-4 h-4 text-blue-600" />;
    case 'breakdown': return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'return': return <ArrowRightLeft className="w-4 h-4 text-orange-600" />;
    default: return <FileText className="w-4 h-4 text-gray-600" />;
  }
};

const RequestTypeLabel = ({ type }: { type: string }) => {
  const labels: Record<string, string> = {
    new_hire: '新規貸出',
    breakdown: '故障・交換',
    return: '返却',
  };
  return <span className="text-sm text-gray-700">{labels[type] || type}</span>;
};

// --- Modal Component ---

interface RequestDetailModalProps {
  request: Request | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: RequestStatus, adminNote: string) => void;
}

const RequestDetailModal = ({ request, onClose, onUpdateStatus }: RequestDetailModalProps) => {
  const [adminNote, setAdminNote] = useState('');

  if (!request) return null;

  const handleAction = (newStatus: RequestStatus) => {
    if (!confirm(`ステータスを更新しますか？`)) return;
    onUpdateStatus(request.id, newStatus, adminNote);
    onClose();
    setAdminNote(''); // Reset
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full bg-white border border-gray-200 shadow-sm`}>
                  <RequestTypeIcon type={request.type} />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-800">申請詳細</h3>
                 <p className="text-xs text-gray-500">ID: {request.id}</p>
               </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Left Column: Request Info */}
             <div className="md:col-span-2 space-y-6">
                {/* User Info Card */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                      {request.userName.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900">{request.userName}</p>
                      <p className="text-sm text-blue-800">{request.userDept}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">申請種別</label>
                      <p className="text-gray-800 font-medium flex items-center gap-2 mt-1">
                         <RequestTypeLabel type={request.type} />
                      </p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">申請内容</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm leading-relaxed">
                         {request.detail}
                      </div>
                   </div>
                   {request.note && (
                    <div>
                       <label className="text-xs font-bold text-gray-400 uppercase">ユーザー備考</label>
                       <p className="text-sm text-gray-600 mt-1 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400" />
                          {request.note}
                       </p>
                    </div>
                   )}
                </div>
             </div>

             {/* Right Column: Action Panel */}
             <div className="space-y-6 border-l border-gray-100 pl-6">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase">現在のステータス</label>
                   <div className="mt-2">
                      <StatusBadge status={request.status} />
                   </div>
                   <p className="text-xs text-gray-400 mt-1">申請日: {request.date}</p>
                </div>

                {/* Admin Actions Form */}
                <div className="space-y-3">
                   <label className="text-xs font-bold text-gray-400 uppercase">管理者メモ</label>
                   <textarea
                      className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      placeholder="対応内容や却下理由を入力..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                   />
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                   {request.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAction('approved')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                           <Check className="w-4 h-4" /> 承認・手配開始
                        </button>
                        <button 
                          onClick={() => handleAction('rejected')}
                          className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                           <XCircle className="w-4 h-4" /> 却下する
                        </button>
                      </>
                   )}
                   {request.status === 'approved' && (
                      <button 
                        onClick={() => handleAction('completed')}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                         <CheckCircle2 className="w-4 h-4" /> 対応完了とする
                      </button>
                   )}
                   {(request.status === 'completed' || request.status === 'rejected') && (
                      <p className="text-center text-xs text-gray-400 bg-gray-50 py-2 rounded">この申請は対応済みです</p>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- Main Page Component ---

export default function RequestsPage() {
  // State
  const [requests, setRequests] = useState<Request[]>(MOCK_REQUESTS);
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Handlers
  const handleUpdateStatus = (id: string, newStatus: RequestStatus, adminNote: string) => {
    setRequests(requests.map(req => 
      req.id === id 
        ? { ...req, status: newStatus, adminNote: adminNote } 
        : req
    ));
    // 実際の開発ではここでAPIを叩いてDB更新！
    console.log(`Request ${id} updated: ${newStatus}, Note: ${adminNote}`);
  };

  // Filtering
  const filteredRequests = requests.filter(req => {
    // ステータスフィルター
    if (filter === 'pending' && req.status !== 'pending') return false;
    
    // 検索フィルター
    const term = searchTerm.toLowerCase();
    return (
      req.userName.toLowerCase().includes(term) ||
      req.userDept.toLowerCase().includes(term) ||
      req.detail.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <RequestDetailModal 
        request={selectedRequest} 
        onClose={() => setSelectedRequest(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">申請一覧</h2>
        <div className="flex gap-2">
          {/* Filter Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
                すべて
            </button>
            <button 
                onClick={() => setFilter('pending')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'pending' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                未処理のみ
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="申請者, 部署, 内容..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 w-32">種別</th>
              <th className="px-6 py-3 font-medium text-gray-500">申請日</th>
              <th className="px-6 py-3 font-medium text-gray-500">申請者 (部署)</th>
              <th className="px-6 py-3 font-medium text-gray-500">内容・備考</th>
              <th className="px-6 py-3 font-medium text-gray-500">ステータス</th>
              <th className="px-6 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRequests.map((req) => (
              <tr 
                key={req.id} 
                onClick={() => setSelectedRequest(req)}
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all`}>
                          <RequestTypeIcon type={req.type} />
                        </div>
                        <RequestTypeLabel type={req.type} />
                    </div>
                </td>
                <td className="px-6 py-4 text-gray-600 font-mono text-xs">{req.date}</td>
                <td className="px-6 py-4">
                    <div>
                        <p className="font-bold text-gray-800">{req.userName}</p>
                        <p className="text-xs text-gray-500">{req.userDept}</p>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <p className="text-gray-800 font-medium truncate max-w-xs">{req.detail}</p>
                    {req.note && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {req.note}</p>}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === 'pending' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                            対応する
                        </button>
                  ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </td>
              </tr>
            ))}
            
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                   <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p>条件に一致する申請はありません</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}