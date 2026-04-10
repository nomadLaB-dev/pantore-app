export type Role = 'admin' | 'manager' | 'user';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    createdAt: Date;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    hireDate: Date;
    leaveDate: Date | null;
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
