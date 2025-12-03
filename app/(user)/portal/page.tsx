"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Monitor,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Laptop,
  PackageOpen
} from 'lucide-react';

import {
  type RequestStatus,
  type Request,
  type UserDetail
} from '@/lib/types';
import { fetchMyRequestsAction } from '@/app/actions/requests';
import { fetchUserDetailAction } from '@/app/actions/users';
import { fetchCurrentUserAction } from '@/app/actions/auth';
import { createClient } from '@/utils/supabase/client';
import { DeviceListModal } from '@/components/features/portal/DeviceListModal';
import { RequestListModal } from '@/components/features/portal/RequestListModal';

// --- Components ---

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

export default function UserPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceListOpen, setIsDeviceListOpen] = useState(false);
  const [isRequestListOpen, setIsRequestListOpen] = useState(false);

  useEffect(() => {
    // ... (fetchData logic remains the same)
    const fetchData = async () => {
      try {
        const [reqs, userData] = await Promise.all([
          fetchMyRequestsAction(),
          fetchCurrentUserAction()
        ]);

        if (!userData) {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        console.log('Fetched requests:', reqs);
        console.log('User ID:', userData.id);

        setRequests(reqs);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 申請履歴のフィルタリングロジック
  const myRequests = useMemo(() => {
    if (!user) return []; // User not loaded yet

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    return requests
      .filter(req => {
        if (req.userId !== user.id) return false;

        const requestDate = new Date(req.date);
        const isRecent = requestDate >= threeMonthsAgo;
        const isUnfinished = req.status === 'pending' || req.status === 'approved';

        return isRecent || isUnfinished;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [requests, user]);

  const displayedRequests = myRequests.slice(0, 3);
  const remainingRequestsCount = myRequests.length - 3;

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <DeviceListModal
        isOpen={isDeviceListOpen}
        onClose={() => setIsDeviceListOpen(false)}
        devices={user.currentDevices || []}
      />
      <RequestListModal
        isOpen={isRequestListOpen}
        onClose={() => setIsRequestListOpen(false)}
        requests={myRequests}
      />

      {/* Welcome Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-pantore-600 to-pantore-500 p-8 rounded-2xl text-white shadow-lg shadow-pantore-200">
        <div>
          <h2 className="text-3xl font-bold mb-2">Hello, {user.name} 👋</h2>
          <p className="text-pantore-50 opacity-90">
            今日は何をパントリー（資産庫）から取り出しますか？
          </p>
        </div>
        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
          <PackageOpen className="w-10 h-10 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Device Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantore-200">
          <h3 className="font-bold text-pantore-800 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-pantore-500" />
            あなたの利用デバイス
          </h3>

          {user.currentDevices && user.currentDevices.length > 0 ? (
            <div className="space-y-4">
              {/* Show only the first device */}
              <div className="flex flex-col gap-3 p-4 bg-pantore-50 rounded-xl border border-pantore-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-white rounded-lg border border-pantore-200 flex items-center justify-center text-pantore-400 shadow-sm">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-pantore-800">{user.currentDevices[0].model}</p>
                    <p className="text-sm text-pantore-500 font-mono">S/N: {user.currentDevices[0].serial}</p>
                  </div>
                </div>
                <Link
                  href={`/portal/request/repair?device=${user.currentDevices[0].serial}`}
                  className="w-full py-2 text-sm font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4" /> 故障・不具合を報告する
                </Link>
              </div>

              {/* Show "Others" button if more than 1 device */}
              {user.currentDevices.length > 1 && (
                <button
                  onClick={() => setIsDeviceListOpen(true)}
                  className="w-full py-3 text-sm font-bold text-pantore-600 bg-pantore-50 border border-pantore-200 rounded-xl hover:bg-pantore-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Laptop className="w-4 h-4" />
                  他 {user.currentDevices.length - 1} 台のデバイスを表示
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-pantore-400 bg-pantore-50 rounded-xl border border-dashed border-pantore-200">
              <p>現在利用中のデバイスはありません</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantore-200">
          <h3 className="font-bold text-pantore-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-pantore-500" />
            申請メニュー
          </h3>
          <div className="space-y-3">
            {/* 新規貸出申請 */}
            <Link
              href="/portal/request/new"
              className="block w-full text-left p-4 rounded-xl border border-pantore-200 hover:border-pantore-400 hover:bg-pantore-50 transition-all group bg-white"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-pantore-700 group-hover:text-pantore-900">💻 新しいPCを申請する</span>
                <ChevronRight className="w-4 h-4 text-pantore-300 group-hover:text-pantore-500" />
              </div>
              <p className="text-xs text-pantore-500 mt-1 font-medium">入社・異動に伴う新規貸出はこちら</p>
            </Link>

            {/* 返却申請 */}
            <Link
              href="/portal/request/return"
              className="block w-full text-left p-4 rounded-xl border border-pantore-200 hover:border-pantore-400 hover:bg-pantore-50 transition-all group bg-white"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-pantore-700 group-hover:text-pantore-900">📦 返却申請</span>
                <ChevronRight className="w-4 h-4 text-pantore-300 group-hover:text-pantore-500" />
              </div>
              <p className="text-xs text-pantore-500 mt-1 font-medium">退職・交換時の返却はこちら</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Request History */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantore-200">
        <h3 className="font-bold text-pantore-800 mb-4">申請履歴（直近・未完了）</h3>
        <div className="space-y-3">
          {displayedRequests.length > 0 ? (
            <>
              {displayedRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-pantore-50 rounded-xl border border-pantore-100 hover:border-pantore-200 transition-colors">
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
              ))}
              {remainingRequestsCount > 0 && (
                <button
                  onClick={() => setIsRequestListOpen(true)}
                  className="w-full py-3 text-sm font-bold text-pantore-600 bg-pantore-50 border border-pantore-200 rounded-xl hover:bg-pantore-100 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  他 {remainingRequestsCount} 件の申請を表示
                </button>
              )}
            </>
          ) : (
            <p className="text-center py-8 text-pantore-400">該当する申請履歴はありません</p>
          )}
        </div>
      </div>
    </div>
  );
}