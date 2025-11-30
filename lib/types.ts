// ==========================================
// Type Definitions
// ==========================================

export type Tenant = {
  id: string;
  name: string;
};

export type Role = 'admin' | 'manager' | 'user';

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'repair' | 'disposed';

export type RequestType = 'new_hire' | 'breakdown' | 'return';

export type RequestStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export type UserStatus = 'active' | 'inactive';

// 所有形態の定義
export type OwnershipType = 'owned' | 'rental' | 'lease' | 'byod';

export const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
    owned: '自社保有 (購入)',
    rental: 'レンタル',
    lease: 'リース',
    byod: 'BYOD (私物)',
};

// 付属品リストの定義
export const ASSET_ACCESSORIES = [
    '充電アダプタ',
    '電源ケーブル',
    'マウス',
    'マウスパッド',
    'HDMIケーブル',
    '変換アダプタ',
    '外箱',
    '保証書',
    'キーボード',
    'ケース/バッグ'
];

// 🆕 マスタデータの型定義
export interface MasterData {
    companies: string[];
    departments: string[];
    branches: string[];
}

// 組織設定
export interface OrganizationSettings {
    id?: string;
    tenantId?: string;
    name: string;
    allowedOwnerships: OwnershipType[];
    contactLabel: string;
    contactValue: string;
}

// 資産（PC）データ型
export interface Asset {
    id: string;
    tenantId?: string;
    managementId: string;
    serial: string;
    model: string;
    userId: string | null;
    userName: string | null;
    status: AssetStatus;

    ownership: OwnershipType;
    purchaseDate: string;

    contractEndDate?: string;
    purchaseCost?: number;
    monthlyCost?: number;
    months?: number;

    // 🆕 減価償却・契約書
    depreciationMonths?: number;
    contractFile?: string;

    accessories?: string[];
    note?: string;
}

// ユーザー一覧用データ型
export interface UserSummary {
    id: string;
    tenantId?: string;
    name: string;
    email: string;
    role: Role;
    company: string;
    dept: string;
    deviceCount: number;
    status: UserStatus;
    avatar?: string;
}

// 所属履歴型
export interface EmploymentHistory {
    id: number;
    tenantId?: string;
    startDate: string;
    endDate: string | null;
    company: string;
    dept: string;
    branch: string;
    position: string;
}

// デバイス利用履歴型
export interface DeviceHistory {
    model: string;
    serial: string;
    assignedAt: string;
    returnedAt?: string;
}

// ユーザー詳細データ型
export interface UserDetail extends UserSummary {
    currentDevice: DeviceHistory | null;
    history: EmploymentHistory[];
}

// 申請データ型
export interface Request {
    id: string;
    tenantId?: string;
    type: RequestType;
    userId: string;
    userName: string;
    userDept: string;
    date: string;
    status: RequestStatus;
    detail: string;
    note?: string;
    adminNote?: string;
}

// 新規申請作成用データ型 (ID, status, userName, userDept, adminNote は除外)
export type CreateRequestInput = Omit<Request, 'id' | 'status' | 'userName' | 'userDept' | 'adminNote'>;

// KPIデータ型
export interface KPIData {
    totalAssets: number;
    utilizationRate: number;
    incidents: number;
    mttr: number;
    costMonth: number;
    costDiff: number;
}
