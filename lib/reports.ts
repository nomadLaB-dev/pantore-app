import {
  MOCK_ASSETS,
  MOCK_USERS_LIST,
  MOCK_REQUESTS,
  OWNERSHIP_LABELS, // 日本語ラベル用に追加
  type Asset,
  type UserSummary,
  type Request,
} from '@/lib/demo';

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

// 🆕 資産詳細レポート用の型定義
export interface AssetDetailRow {
  managementId: string;
  model: string;
  serial: string;
  ownership: string; // 日本語ラベル
  status: string;    // 日本語ラベル(簡易)
  userName: string;
  company: string;
  dept: string;
  monthlyCost: number;
  purchaseDate: string;
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
 * 🆕 資産明細リスト（詳細版）を生成します。
 * 全ての稼働資産（レンタル・リース・自社保有問わず）またはコスト対象のみなど、
 * 用途に合わせてフィルタリングします。（今回は全資産リストとして出力）
 */
export const getAssetDetailList = (): AssetDetailRow[] => {
  const userMap = new Map<string, UserSummary>(
    MOCK_USERS_LIST.map((user) => [user.id, user])
  );

  // ステータスの日本語マッピング（簡易）
  const statusLabels: Record<string, string> = {
    in_use: '貸出中',
    available: '在庫',
    maintenance: 'メンテ中',
    repair: '修理中',
    disposed: '廃棄済',
  };

  return MOCK_ASSETS.map(asset => {
    const user = asset.userId ? userMap.get(asset.userId) : null;
    
    return {
      managementId: asset.managementId,
      model: asset.model,
      serial: asset.serial,
      ownership: OWNERSHIP_LABELS[asset.ownership] || asset.ownership,
      status: statusLabels[asset.status] || asset.status,
      userName: user ? user.name : '未割当',
      company: user ? user.company : '-',
      dept: user ? user.dept : '-',
      // コストはレンタル/リースなら月額、購入なら0（または減価償却計算など、要件次第）
      monthlyCost: asset.monthlyCost || 0, 
      purchaseDate: asset.purchaseDate,
    };
  });
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