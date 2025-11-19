"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getCostReport, getIncidentReport, CostReportRow, IncidentReportData } from '@/lib/reports';
import { BarChart, AlertTriangle, Calendar, ChevronsRight } from 'lucide-react';

type ReportType = 'cost' | 'incident';

const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>('cost');
  const [date, setDate] = useState({ year: 2025, month: 11 });
  const [costData, setCostData] = useState<CostReportRow[]>([]);
  const [incidentData, setIncidentData] = useState<IncidentReportData>({ count: 0, requests: [] });

  useEffect(() => {
    if (reportType === 'cost') {
      const data = getCostReport(date.year, date.month);
      setCostData(data);
    } else {
      const data = getIncidentReport(date.year, date.month);
      setIncidentData(data);
    }
  }, [reportType, date]);

  const totalCost = useMemo(() => {
    return costData.reduce((sum, row) => sum + row.cost, 0);
  }, [costData]);

  const years = [2025, 2024, 2023];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const TabButton = ({ type, children }: { type: ReportType; children: React.ReactNode }) => (
    <button
      onClick={() => setReportType(type)}
      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
        reportType === type
          ? 'bg-white text-pantore-700 shadow-sm'
          : 'text-pantore-600 hover:bg-white/50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="h-full w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">レポート</h1>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 border">
          <TabButton type="cost"><BarChart className="w-4 h-4" /> コストレポート</TabButton>
          <TabButton type="incident"><AlertTriangle className="w-4 h-4" /> インシデント</TabButton>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-600">集計期間:</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={date.year}
            onChange={(e) => setDate({ ...date, year: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select
            value={date.month}
            onChange={(e) => setDate({ ...date, month: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'cost' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-in fade-in duration-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">会社</th>
                <th className="px-6 py-3 font-medium text-gray-500">部署</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">台数</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">レンタル費用 (月額)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {costData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{row.company}</td>
                  <td className="px-6 py-4 text-gray-600">{row.dept}</td>
                  <td className="px-6 py-4 text-gray-600 text-right font-mono">{row.assetCount}台</td>
                  <td className="px-6 py-4 text-gray-800 text-right font-mono font-semibold">¥{row.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2">
              <tr>
                <td colSpan={3} className="px-6 py-4 font-bold text-gray-700 text-right">合計</td>
                <td className="px-6 py-4 text-xl font-bold text-blue-600 text-right font-mono">¥{totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
            <h3 className="font-bold text-gray-600">当月インシデント発生件数</h3>
            <p className="text-4xl font-bold text-orange-500">{incidentData.count} <span className="text-lg font-medium text-gray-500">件</span></p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">申請日</th>
                  <th className="px-6 py-3 font-medium text-gray-500">申請者</th>
                  <th className="px-6 py-3 font-medium text-gray-500">部署</th>
                  <th className="px-6 py-3 font-medium text-gray-500">件名</th>
                  <th className="px-6 py-3 font-medium text-gray-500">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {incidentData.requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{req.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{req.userName}</td>
                    <td className="px-6 py-4 text-gray-600">{req.userDept}</td>
                    <td className="px-6 py-4 text-gray-600">{req.detail}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-100">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
