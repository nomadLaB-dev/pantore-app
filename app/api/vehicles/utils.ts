export function mapVehicleToFrontend(vehicle: any) {
    if (!vehicle) return null;

    return {
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
        insurances: Array.isArray(vehicle.insurances) ? vehicle.insurances : [],
        accidents: Array.isArray(vehicle.accidents) ? vehicle.accidents : [],
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
    };
}
