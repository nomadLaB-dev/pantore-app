import {
  MOCK_ASSETS,
  MOCK_USERS_LIST,
  MOCK_REQUESTS,
  Asset,
  UserSummary,
  Request,
} from './demo';

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
 * 指定された年月のレンタルPCコストレポートを生成します。
 * @param year - 年
 * @param month - 月 (1-12)
 * @returns 部署ごとのコストデータ
 */
export const getCostReport = (year: number, month: number): CostReportRow[] => {
  const userMap = new Map<string, UserSummary>(
    MOCK_USERS_LIST.map((user) => [user.id, user])
  );

  const report: { [key: string]: CostReportRow } = {};

  MOCK_ASSETS.filter(
    (asset) =>
      asset.isRental &&
      asset.userId &&
      (asset.status === 'in_use' || asset.status === 'maintenance')
  ).forEach((asset) => {
    const user = userMap.get(asset.userId!);
    if (!user) return;

    const cost = asset.monthlyCost || 0; // MOCK_RENTAL_COSTSからasset.monthlyCostに変更
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
 * @param year - 年
 * @param month - 月 (1-12)
 * @returns インシデント件数と該当リクエストのリスト
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
