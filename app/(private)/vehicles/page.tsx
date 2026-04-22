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
            purchase:vehicle_purchases(*)
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
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
    }));

    if (error) {
        console.error("Failed to fetch vehicles:", error);
    }

    const totalVehiclesCount = vehicles.length;
    const leasedCount = vehicles.filter((v) => v.ownershipType === 'leased').length;
    const ownedCount = totalVehiclesCount - leasedCount;
    const branchCount = new Set(vehicles.map((v) => v.branchId)).size;

    return (
        <VehiclesClient
            vehicles={vehicles}
            branches={branches}
            stats={{
                totalVehiclesCount,
                leasedCount,
                ownedCount,
                branchCount
            }}
        />
    );
}
