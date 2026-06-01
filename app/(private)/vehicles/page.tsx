import { createClient } from '@/lib/supabase/server';
import { VehiclesClient } from './vehicles-client';

export default async function VehiclesPage() {
    const supabase = await createClient();

    // 支社情報の取得 (Dropdown用)
    const { data: branchesResponse } = await supabase
        .from('branches')
        .select('*')
        .order('name');
    const branches = branchesResponse || [];

    // 車両リストの取得
    const { data: vehiclesResponse, error } = await supabase
        .from('vehicles')
        .select(`
            *,
            branch:branches(*),
            lease:vehicle_leases(*),
            purchase:vehicle_purchases(*),
            inspections:vehicle_inspection(*)
        `)
        .order('created_at', { ascending: false });

    // データの正規化
    const vehicles = (vehiclesResponse || []).map((vehicle) => ({
        id: vehicle.id,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        licensePlate: vehicle.license_plate,
        licensePlateColor: vehicle.license_plate_color,
        ownershipType: vehicle.ownership_type,
        branchId: vehicle.branch_id,
        tireType: vehicle.tire_type,
        isTransportBureauApplied: vehicle.is_transport_bureau_applied,
        branch: vehicle.branch ? { id: vehicle.branch.id, name: vehicle.branch.name } : null,
        lease: vehicle.lease ? {
            leaseCompany: vehicle.lease.lease_company,
            contractStartDate: vehicle.lease.contract_start_date,
            contractEndDate: vehicle.lease.contract_end_date,
            monthlyFee: vehicle.lease.monthly_fee,
        } : null,
        purchase: vehicle.purchase ? {
            acquisitionCost: vehicle.purchase.acquisition_cost,
            purchaseDate: vehicle.purchase.purchase_date,
            firstRegistrationDate: vehicle.purchase.first_registration_date,
            bodyType: vehicle.purchase.body_type,
            isNewCar: vehicle.purchase.is_new_car,
            method: vehicle.purchase.method,
        } : null,
        insurances: Array.isArray(vehicle.insurances) ? vehicle.insurances : [],
        accidents: Array.isArray(vehicle.accidents) ? vehicle.accidents : [],
        inspections: Array.isArray(vehicle.inspections) ? vehicle.inspections.map((insp: any) => ({
            id: insp.id,
            accidentsId: insp.accidents_id,
            inspectionType: insp.inspection_type,
            inspectionStartDate: insp.inspection_start_date,
            inspectionEndDate: insp.inspection_end_date,
            inspectionCost: insp.inspection_cost,
            nextInspectionMileage: insp.next_inspection_mileage,
            nextInspectionDate: insp.next_inspection_date,
            notes: insp.notes,
        })) : [],
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
    }));

    if (error) {
        console.error("Failed to fetch vehicles:", error);
    }

    const totalVehiclesCount = vehicles.length;
    
    // 日本標準時（JST）の本日の日付（YYYY-MM-DD）を取得
    const today = new Date();
    const todayStr = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 修理中台数（本日時点で修理中の車両数）の集計
    const inRepairCount = vehicles.filter((v) => 
        v.inspections.some((insp: any) => 
            insp.inspectionStartDate && insp.inspectionStartDate <= todayStr &&
            insp.inspectionEndDate && insp.inspectionEndDate >= todayStr
        )
    ).length;

    // 実働可能台数
    const activeCount = totalVehiclesCount - inRepairCount;
    
    const notAppliedCount = vehicles.filter((v) => v.isTransportBureauApplied === false).length;

    return (
        <VehiclesClient
            vehicles={vehicles}
            branches={branches}
            stats={{
                totalVehiclesCount,
                activeCount,
                inRepairCount,
                notAppliedCount
            }}
        />
    );
}
