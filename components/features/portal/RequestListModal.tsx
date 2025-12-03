"use client";

import React from 'react';
import { X, FileText, CheckCircle2, Clock } from 'lucide-react';
import { type Request, type RequestStatus } from '@/lib/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requests: Request[];
}

const StatusBadge = ({ status }: { status: RequestStatus }) => {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        approved: 'bg-pantore-100 text-pantore-700 border-pantore-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
    };

    const labels: Record<string, string> = {
        pending: '承認待ち',
        approved: '手配中',
        completed: '完了',
        rejected: '却下',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    );
};

export const RequestListModal = ({ isOpen, onClose, requests }: Props) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-pantore-500" />
                        申請履歴一覧
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {requests.length > 0 ? (
                        requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-pantore-50 rounded-xl border border-pantore-100">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-full ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-pantore-200 text-pantore-600'
                                        }`}>
                                        {req.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                            req.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                                <FileText className="w-5 h-5" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-pantore-800">
                                            {req.type === 'new_hire' ? '新規貸出申請' : req.type === 'breakdown' ? '故障修理申請' : '返却申請'}
                                        </p>
                                        <p className="text-xs text-pantore-500 mt-0.5 font-medium">
                                            申請日: {req.date} ・ {req.detail}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={req.status} />
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-pantore-400">申請履歴はありません</p>
                    )}
                </div>
            </div>
        </div>
    );
};
