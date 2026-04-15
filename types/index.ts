export type Role = 'admin' | 'manager' | 'user';
export type AccountStatus = 'active' | 'disabled' | 'none';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    createdAt: Date;
}

// 支社
export interface Branch {
    id: string;
    name: string;
    address: string;
}

// 雇用区分
export type EmploymentCategory = 'full_time' | 'part_time' | 'contract' | 'dispatch';

export const EmploymentCategoryLabel: Record<EmploymentCategory, string> = {
    full_time: '正社員',
    part_time: 'パート・アルバイト',
    contract: '契約社員',
    dispatch: '派遣社員',
};

// 給与形態
export type SalaryType = 'monthly' | 'hourly' | 'annual';

export const SalaryTypeLabel: Record<SalaryType, string> = {
    monthly: '月給',
    hourly: '時給',
    annual: '年俸',
};

// 有期雇用の雇用区分
export const FIXED_TERM_CATEGORIES: EmploymentCategory[] = ['part_time', 'contract', 'dispatch'];

export interface EmploymentTypeHistory {
    id: string;
    employeeId: string;
    category: EmploymentCategory;
    startDate: Date;
    endDate: Date | null;       // 区分上の終了日（次の区分開始日 - 1日）

    // 給与情報
    salary: number | null;      // 金額（時給なら円/時、月給・年俸なら円）
    salaryType: SalaryType | null;

    // 有期雇用の場合の契約期間
    contractStartDate: Date | null;
    contractEndDate: Date | null;
    renewalPlanned: boolean;    // true の場合は期限アラートを抑制

    // 主な配置（異動先）— 契約時に記入
    primaryBranchId: string | null;
    assignmentNote: string | null;  // 部署名・役職など自由記述
}

export interface Employee {
    id: string;
    name: string;
    lastName?: string;
    firstName?: string;
    email: string;
    hireDate: Date;
    leaveDate: Date | null;
    // アカウント状態
    accountStatus: AccountStatus;
    // 現在の雇用区分（latest EmploymentTypeHistory から取得）
    currentEmploymentCategory?: EmploymentCategory;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkloadHistory {
    id: string;
    employeeId: string;
    workload: number;
    startDate: Date;
    endDate: Date | null;
}

export type ShiftType = 'full' | 'half' | 'off' | 'custom';

export interface Shift {
    id: string;
    employeeId: string;
    date: Date;
    type: ShiftType;
}

export type AssetType = 'vehicle' | 'real_estate';

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    createdAt: Date;
}

export type OwnershipType = 'owned' | 'leased';

// ナンバープレートの色区分
export type LicensePlateColor = 'white' | 'yellow' | 'green' | 'black';

export const LicensePlateColorLabel: Record<LicensePlateColor, string> = {
    white: '白（普通車）',
    yellow: '黄（軽自動車）',
    green: '緑（営業用普通車）',
    black: '黒（営業用軽自動車）',
};

export interface Vehicle {
    id: string;
    assetId: string;

    ownershipType: OwnershipType;

    manufacturer: string;
    model: string;
    licensePlate: string;
    licensePlateColor: LicensePlateColor;

    // 人ではなく支社に紐づける
    branchId: string | null;
}

export interface VehicleLease {
    id: string;
    vehicleId: string;
    leaseCompany: string;
    contractStartDate: Date;
    contractEndDate: Date;
    monthlyFee: number;
}

export type InsuranceType = 'compulsory' | 'voluntary';
export const InsuranceTypeLabel: Record<InsuranceType, string> = {
    compulsory: '自賠責保険',
    voluntary: '任意保険',
};

export interface VehicleInsurance {
    id: string;
    vehicleId: string;
    type: InsuranceType;
    companyName: string;
    startDate: Date;
    endDate: Date;
    premiumAmount: number | null;
    coverageDetails: string | null;  // 補償内容のフリーテキストやサマリ
}

export type SeverityType = 'low' | 'medium' | 'high';

export interface VehicleAccident {
    id: string;
    vehicleId: string;
    employeeId: string | null;
    accidentDate: Date;
    description: string;
    severity: SeverityType;
}

export interface RealEstate {
    id: string;
    assetId: string;
    address: string;
    ownershipType: OwnershipType;
}

export interface Contract {
    id: string;
    relatedType: 'vehicle' | 'real_estate';
    relatedId: string;
    startDate: Date;
    endDate: Date;
    alertDaysBefore: number;
}

// ---- Subscription -------------------------------------------------------

export type SubscriptionCurrency = 'JPY' | 'USD';

export type SubscriptionBillingInterval = 'monthly' | 'annual' | 'usage' | 'one_time';

export const SubscriptionBillingIntervalLabel: Record<SubscriptionBillingInterval, string> = {
    monthly: '月額',
    annual: '年額',
    usage: '従量課金',
    one_time: '単挥払い',
};

export interface SubscriptionPriceHistory {
    id: string;
    subscriptionId: string;
    amount: number;
    currency: SubscriptionCurrency;
    effectiveFrom: Date;
    note: string | null;
}

export interface Subscription {
    id: string;
    serviceName: string;
    serviceUrl: string | null;
    corporateName: string;
    billingInterval: SubscriptionBillingInterval;
    branchId: string | null;
    assigneeEmployeeId: string | null;
    // 現在の金額（最新の SubscriptionPriceHistory から）
    currentAmount: number | null;
    currentCurrency: SubscriptionCurrency;
    createdAt: Date;
    updatedAt: Date;
}

export interface AssetAssignment {
    id: string;
    assetId: string;
    employeeId: string;
    startDate: Date;
    endDate: Date | null;
}

export type AuditLogAction = 'create' | 'update' | 'delete';

export interface AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: AuditLogAction;
    before: any;
    after: any;
    operatedBy: string;
    operatedAt: Date;
}

// ---- Client (取引先) -------------------------------------------------

export interface Client {
    id: string;
    companyName: string;
    department: string | null;
    contactName: string;
    contactEmail: string | null;
    contactPhone: string | null;
    billingName: string | null;
    billingEmail: string | null;
    billingAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ---- Deal (取引) -----------------------------------------------------

export type DealBillingType = 'shot' | 'recurring';
export type DealStatus = 'active' | 'completed' | 'cancelled';

export const DealBillingTypeLabel: Record<DealBillingType, string> = {
    shot: 'スポット（単発）',
    recurring: '継続課金',
};

export const DealStatusLabel: Record<DealStatus, string> = {
    active: '進行中',
    completed: '完了',
    cancelled: 'キャンセル',
};

export interface Deal {
    id: string;
    clientId: string;
    name: string;
    startDate: Date;
    endDate: Date | null;
    autoRenew: boolean;
    billingType: DealBillingType;
    amount: number;
    currency: 'JPY' | 'USD';
    status: DealStatus;
    notes: string | null;
    createdAt: Date;
}

