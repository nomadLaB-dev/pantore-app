"use client";

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  AlertCircle,
  BarChart3,
  Plus,
  ArrowRightLeft,
  FileText
} from 'lucide-react';

import {
  fetchDashboardKpiAction,
  fetchRequestsAction,
  fetchAssetStatusStatsAction,
} from '@/app/actions';
import { type Request, type Tenant } from '@/lib/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// The DashboardKpi type seems to be defined in app/actions.ts, which is not ideal.
// For now, we will assume its structure based on the previous file.
// A better refactor would be to move this type to lib/types.ts as well.
type DashboardKpi = {
  totalAssets: number;
  utilizationRate: number;
  incidents: number;
  mttr: string;
  costMonth: number;
  costDiff: number;
};


// --- Sub-components ---
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

interface DashboardClientPageProps {
  activeTenant: Tenant;
}

export default function DashboardClientPage({ activeTenant }: DashboardClientPageProps) {
  const [kpiData, setKpiData] = useState<DashboardKpi | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [assetStats, setAssetStats] = useState({ in_use: 0, available: 0, repair: 0, maintenance: 0, disposed: 0 });

  useEffect(() => {
    if (!activeTenant?.id) return;

    const fetchData = async () => {
      // Pass tenantId to the data fetching actions
      const kpi = await fetchDashboardKpiAction(2025, 11, activeTenant.id);
      setKpiData(kpi);

      const reqs = await fetchRequestsAction(activeTenant.id);
      setRequests(reqs);

      const stats = await fetchAssetStatusStatsAction(activeTenant.id);
      setAssetStats(stats);
    };
    fetchData();
  }, [activeTenant]); // Re-run effect when activeTenant changes

  const costDiffInMan = kpiData ? (kpiData.costDiff / 10000).toFixed(1) : 0;
  const costDiffColor = kpiData && kpiData.costDiff > 0 ? 'text-red-500' : 'text-green-500';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800">
        {activeTenant.name} 運用レポート (2025年11月)
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">総管理台数</p>
            <Monitor className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{kpiData?.totalAssets ?? '...'}<span className="text-sm font-normal text-gray-500 ml-1">台</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">稼働率</p>
            <BarChart3 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{kpiData?.utilizationRate ?? '...'}<span className="text-sm font-normal text-gray-500 ml-1">%</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">当月インシデント</p>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{kpiData?.incidents ?? '...'}<span className="text-sm font-normal text-gray-500 ml-1">件</span></p>
          <p className="text-xs text-gray-400 mt-1">MTTR: {kpiData?.mttr ?? '...'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">概算コスト</p>
            {kpiData && (
              <p className={`text-xs font-medium ${costDiffColor}`}>
                {kpiData.costDiff >= 0 ? '+' : ''}{costDiffInMan}万 (前月比)
              </p>
            )}
          </div>
          <p className="text-2xl font-bold mt-2">
            ¥{kpiData ? (kpiData.costMonth / 10000).toFixed(1) : '...'}<span className="text-sm font-normal text-gray-500 ml-1">万</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* グラフエリア */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">デバイスステータス内訳</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: ['貸出中', '在庫', '修理・メンテ'],
                datasets: [
                  {
                    label: '台数',
                    data: [
                      assetStats.in_use,
                      assetStats.available,
                      assetStats.repair + assetStats.maintenance
                    ],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)', // Blue for In Use
                      'rgba(156, 163, 175, 0.8)', // Gray for Available
                      'rgba(239, 68, 68, 0.8)',   // Red for Repair/Maintenance
                    ],
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* 未処理の申請リスト */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">未処理の申請</h3>
          <div className="space-y-4">
            {requests.filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-800">{req.userName}</span>
                  <span className="text-xs text-gray-500">{req.date}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <RequestTypeIcon type={req.type} />
                    {req.type === 'new_hire' ? '新規貸出' : req.type === 'breakdown' ? '故障交換' : '返却'}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}