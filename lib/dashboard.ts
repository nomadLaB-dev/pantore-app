import {
  MOCK_ASSETS,
  MOCK_REQUESTS,
} from '@/lib/demo';

// ==========================================
// Type Definitions for Dashboard
// ==========================================

export interface DashboardKpi {
  totalAssets: number;
  utilizationRate: number;
  incidents: number;
  mttr: string; // N/A or number
  costMonth: number;
  costDiff: number;
}

// ==========================================
// KPI Calculation Functions
// ==========================================

/**
 * 指定された年月のレンタル費用を計算します。
 */
const calculateMonthlyCost = (year: number, month: number): number => {
  // 🚨 修正ポイント: isRental ではなく ownership をチェックするように変更！
  // レンタルまたはリースの場合のみ、月額コストを集計
  return MOCK_ASSETS.filter(asset => 
    asset.ownership === 'rental' || asset.ownership === 'lease'
  ).reduce((total, asset) => {
    return total + (asset.monthlyCost || 0);
  }, 0);
};

/**
 * ダッシュボードに表示するKPIデータを動的に生成します。
 * @param year - 対象年
 * @param month - 対象月 (1-12)
 * @returns 計算されたKPIデータ
 */
export const getDashboardKpi = (year: number, month: number): DashboardKpi => {
  // 1. 総管理台数
  const totalAssets = MOCK_ASSETS.length;

  // 2. 稼働率
  const activeAssets = MOCK_ASSETS.filter(
    (asset) => asset.status === 'in_use' || asset.status === 'maintenance'
  ).length;
  const utilizationRate = totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0;

  // 3. 当月インシデント数
  const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  const incidents = MOCK_REQUESTS.filter(
    (req) => req.type === 'breakdown' && req.date.startsWith(targetMonthStr)
  ).length;

  // 4. MTTR (Mean Time To Repair)
  // NOTE: 完了日がデータにないため、正確な計算は不可。
  const mttr = 'N/A';

  // 5. 概算コスト
  const costMonth = calculateMonthlyCost(year, month);
  
  // 先月の月を取得
  const prevMonthDate = new Date(year, month - 1, 1);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;
  
  const costPrevMonth = calculateMonthlyCost(prevYear, prevMonth);
  const costDiff = costMonth - costPrevMonth;

  return {
    totalAssets,
    utilizationRate,
    incidents,
    mttr,
    costMonth,
    costDiff,
  };
};