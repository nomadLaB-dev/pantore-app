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

export interface EmploymentTypeHistory {
    id: string;
    employeeId: string;
    category: EmploymentCategory;
    startDate: Date;
    endDate: Date | null;
}

export interface Employee {
    id: string;
    name: string;
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

export interface Vehicle {
    id: string;
    assetId: string;
    ownershipType: OwnershipType;
    manufacturer: string;
    model: string;
    licensePlate: string;
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
    relatedType: AssetType;
    relatedId: string;
    startDate: Date;
    endDate: Date;
    alertDaysBefore: number;
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
