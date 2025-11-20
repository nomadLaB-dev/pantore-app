import {
  MOCK_ASSETS,
  MOCK_USERS_LIST,
  MOCK_REQUESTS,
  type Asset,
  type UserSummary,
  type Request,
} from '@/lib/demo'; // 👈 ここを絶対パスに変更！

// ==========================================
// Type Definitions for Reports
// ==========================================

export interface CostReportRow {
  company: string;
  dept: string;
  cost: number;
  assetCount: number;
}

export interface IncidentReportData {
  count: number;
  requests: Request[];
}

// ==========================================
// Report Generation Functions
// ==========================================

/**
 * 指定された年月のレンタル・リースPCコストレポートを生成します。
 */
export const getCostReport = (year: number, month: number): CostReportRow[] => {
  const userMap = new Map<string, UserSummary>(
    MOCK_USERS_LIST.map((user) => [user.id, user])
  );

  const report: { [key: string]: CostReportRow } = {};

  MOCK_ASSETS.filter(
    (asset) =>
      (asset.ownership === 'rental' || asset.ownership === 'lease') && 
      asset.userId &&
      (asset.status === 'in_use' || asset.status === 'maintenance')
  ).forEach((asset) => {
    const user = userMap.get(asset.userId!);
    if (!user) return;

    const cost = asset.monthlyCost || 0;
    const key = `${user.company}-${user.dept}`;

    if (!report[key]) {
      report[key] = {
        company: user.company,
        dept: user.dept,
        cost: 0,
        assetCount: 0,
      };
    }
    report[key].cost += cost;
    report[key].assetCount += 1;
  });

  return Object.values(report).sort((a, b) => b.cost - a.cost);
};

/**
 * 指定された年月のインシデントレポートを生成します。
 */
export const getIncidentReport = (year: number, month: number): IncidentReportData => {
  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

  const incidents = MOCK_REQUESTS.filter((req) => {
    return req.type === 'breakdown' && req.date.startsWith(targetMonth);
  });

  return {
    count: incidents.length,
    requests: incidents,
  };
};