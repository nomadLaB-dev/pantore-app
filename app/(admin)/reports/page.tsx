"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getCostReport, getIncidentReport, type CostReportRow, type IncidentReportData } from '@/lib/reports';
import { 
  BarChart, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  Download,
  FileText,
  ArrowUpDown, // 追加
  ArrowUp,     // 追加
  ArrowDown    // 追加
} from 'lucide-react';

type ReportType = 'cost' | 'incident';
type SortKey = 'company' | 'dept' | 'assetCount' | 'cost';
type SortDirection = 'asc' | 'desc';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('cost');
  const [date, setDate] = useState({ year: 2025, month: 11 });
  
  // データ保持用
  const [costData, setCostData] = useState<CostReportRow[]>([]);
  const [incidentData, setIncidentData] = useState<IncidentReportData>({ count: 0, requests: [] });
  
  // ソート設定用State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'cost', // デフォルトはコスト順
    direction: 'desc' // 高い順
  });

  useEffect(() => {
    if (reportType === 'cost') {
      const data = getCostReport(date.year, date.month);
      setCostData(data);
    } else {
      const data = getIncidentReport(date.year, date.month);
      setIncidentData(data);
    }
  }, [reportType, date]);

  // ソート処理済みのデータ
  const sortedCostData = useMemo(() => {
    // 元の配列を壊さないように [...costData] でコピーしてからソート
    return [...costData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [costData, sortConfig]);

  const totalCost = useMemo(() => {
    return costData.reduce((sum, row) => sum + row.cost, 0);
  }, [costData]);

  // ソート切り替えハンドラー
  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      // 同じキーなら昇順・降順を反転、違うキーならデフォルトで降順('desc')にリセット
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // ソートアイコン表示ヘルパー
  const SortIcon = ({ targetKey }: { targetKey: SortKey }) => {
    if (sortConfig.key !== targetKey) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-pantore-600" /> 
      : <ArrowDown className="w-3 h-3 text-pantore-600" />;
  };

  const years = [2025, 2024, 2023];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // カスタムタブボタン
  const TabButton = ({ type, icon: Icon, label }: { type: ReportType; icon: any; label: string }) => (
    <button
      onClick={() => setReportType(type)}
      className={`
        relative px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 overflow-hidden
        ${reportType === type
          ? 'bg-pantore-600 text-white shadow-md'
          : 'bg-white text-pantore-600 hover:bg-pantore-50 border border-pantore-100'
        }
      `}
    >
      <Icon className="w-4 h-4 z-10" />
      <span className="z-10">{label}</span>
    </button>
  );

  return (
    <div className="h-full w-full space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">月次レポート</h1>
          <p className="text-sm text-gray-500 mt-1">資産コストやインシデント状況の可視化</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
           <TabButton type="cost" icon={BarChart} label="コスト分析" />
           <TabButton type="incident" icon={AlertTriangle} label="インシデント" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-pantore-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-pantore-100 p-2 rounded-lg text-pantore-600">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 text-sm">対象期間:</span>
          <div className="flex items-center gap-2">
            <select
              value={date.year}
              onChange={(e) => setDate({ ...date, year: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pantore-500"
            >
              {years.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select
              value={date.month}
              onChange={(e) => setDate({ ...date, month: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pantore-500"
            >
              {months.map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        </div>
        
        <button className="text-pantore-600 hover:bg-pantore-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          CSVダウンロード
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        
        {reportType === 'cost' ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-gradient-to-br from-pantore-500 to-pantore-600 p-6 rounded-2xl text-white shadow-lg shadow-pantore-200">
                 <p className="text-pantore-100 text-sm font-medium mb-1">月額総コスト</p>
                 <p className="text-3xl font-bold font-mono">¥{totalCost.toLocaleString()}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <p className="text-gray-500 text-sm font-medium mb-1">課金対象台数 (レンタル/リース)</p>
                 <p className="text-3xl font-bold text-gray-800 font-mono">
                   {costData.reduce((acc, cur) => acc + cur.assetCount, 0)}
                   <span className="text-sm font-normal text-gray-500 ml-1">台</span>
                 </p>
               </div>
            </div>

            {/* Cost Table (Sortable!) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2">
                   <Building2 className="w-5 h-5 text-pantore-500" />
                   部署別内訳
                 </h3>
                 <span className="text-xs text-gray-400">項目名クリックで並び替え</span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th 
                      onClick={() => handleSort('company')}
                      className="px-6 py-3 font-bold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">会社 <SortIcon targetKey="company" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('dept')}
                      className="px-6 py-3 font-bold text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">部署 <SortIcon targetKey="dept" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('assetCount')}
                      className="px-6 py-3 font-bold text-gray-500 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">利用台数 <SortIcon targetKey="assetCount" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('cost')}
                      className="px-6 py-3 font-bold text-gray-500 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                       <div className="flex items-center justify-end gap-1">月額費用 <SortIcon targetKey="cost" /></div>
                    </th>
                    <th className="px-6 py-3 font-bold text-gray-500">構成比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedCostData.map((row, i) => {
                    const percentage = totalCost > 0 ? (row.cost / totalCost) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-pantore-50/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-gray-800">{row.company}</td>
                        <td className="px-6 py-4 text-gray-600">{row.dept}</td>
                        <td className="px-6 py-4 text-gray-600 text-right font-mono">{row.assetCount}台</td>
                        <td className="px-6 py-4 text-gray-800 text-right font-mono font-bold">¥{row.cost.toLocaleString()}</td>
                        <td className="px-6 py-4 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-pantore-500 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedCostData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        データがありません 💸
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incident Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex items-center justify-between relative overflow-hidden">
               <div className="z-10">
                  <h3 className="text-gray-500 font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    当月の故障・不具合発生件数
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-extrabold text-gray-800">{incidentData.count}</p>
                    <span className="text-lg font-bold text-gray-500">件</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">※ 故障交換申請に基づきます</p>
               </div>
               {/* Decorative Background Icon */}
               <AlertTriangle className="absolute -right-6 -bottom-6 w-48 h-48 text-red-50 opacity-50 rotate-12" />
            </div>

            {/* Incident Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2">
                   <FileText className="w-5 h-5 text-gray-400" />
                   インシデント詳細リスト
                 </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-bold text-gray-500">発生日</th>
                    <th className="px-6 py-3 font-bold text-gray-500">申請者</th>
                    <th className="px-6 py-3 font-bold text-gray-500">部署</th>
                    <th className="px-6 py-3 font-bold text-gray-500">内容</th>
                    <th className="px-6 py-3 font-bold text-gray-500">ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {incidentData.requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600 font-mono">{req.date}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{req.userName}</td>
                      <td className="px-6 py-4 text-gray-600">{req.userDept}</td>
                      <td className="px-6 py-4 text-gray-800">{req.detail}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${req.status === 'completed' 
                            ? 'bg-gray-100 text-gray-600 border-gray-200' 
                            : 'bg-red-50 text-red-600 border-red-100'}
                        `}>
                          {req.status === 'completed' ? '対応完了' : '対応中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {incidentData.requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        インシデントはありません 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}