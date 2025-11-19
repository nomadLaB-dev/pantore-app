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

import { MOCK_REQUESTS } from '@/lib/demo';
import { getDashboardKpi, type DashboardKpi } from '@/lib/dashboard';

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

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<DashboardKpi | null>(null);

  useEffect(() => {
    // 2025年11月のKPIを計算
    const data = getDashboardKpi(2025, 11);
    setKpiData(data);
  }, []);

  const costDiffInMan = kpiData ? (kpiData.costDiff / 10000).toFixed(1) : 0;
  const costDiffColor = kpiData && kpiData.costDiff > 0 ? 'text-red-500' : 'text-green-500';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800">運用レポート (2025年11月)</h2>
      
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
        {/* グラフエリア（モック） */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">デバイスステータス内訳</h3>
          <div className="h-48 flex items-end justify-around gap-4 p-4 border-b border-l border-gray-100">
            <div className="w-full bg-blue-50 rounded-t-lg h-[80%] flex items-end justify-center pb-2 group relative">
              <span className="text-xs text-blue-800 font-bold">貸出中</span>
            </div>
            <div className="w-full bg-gray-100 rounded-t-lg h-[15%] flex items-end justify-center pb-2">
              <span className="text-xs text-gray-600 font-bold">在庫</span>
            </div>
            <div className="w-full bg-red-50 rounded-t-lg h-[5%] flex items-end justify-center pb-2">
              <span className="text-xs text-red-800 font-bold">修理</span>
            </div>
          </div>
        </div>

        {/* 未処理の申請リスト */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">未処理の申請</h3>
          <div className="space-y-4">
            {MOCK_REQUESTS.filter(r => r.status === 'pending').map(req => (
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