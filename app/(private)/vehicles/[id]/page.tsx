import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { VehicleDetailClient } from './vehicle-detail-client';

export default async function VehicleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const p = await params;
    const { id } = p;
    const supabase = await createClient();

    const { data: vehicleResponse, error } = await supabase
        .from('vehicles')
        .select(`
            *,
            branch:branches(*),
            lease:vehicle_leases(*),
            insurances:vehicle_insurances(*),
            accidents:vehicle_accidents(*)
        `)
        .eq('id', id)
        .single();

    if (error || !vehicleResponse) {
        return notFound();
    }

    // データの正規化 (API route で行っていた処理)
    const vehicle = {
        id: vehicleResponse.id,
        manufacturer: vehicleResponse.manufacturer,
        model: vehicleResponse.model,
        licensePlate: vehicleResponse.license_plate,
        licensePlateColor: vehicleResponse.license_plate_color,
        ownershipType: vehicleResponse.ownership_type,
        branchId: vehicleResponse.branch_id,
        branch: vehicleResponse.branch ? { id: vehicleResponse.branch.id, name: vehicleResponse.branch.name } : null,
        lease: vehicleResponse.lease ? {
            leaseCompany: vehicleResponse.lease.lease_company,
            contractStartDate: vehicleResponse.lease.contract_start_date,
            contractEndDate: vehicleResponse.lease.contract_end_date,
            monthlyFee: vehicleResponse.lease.monthly_fee,
        } : null,
        insurances: (vehicleResponse.insurances || []).map((ins: any) => ({
            id: ins.id,
            companyName: ins.company_name,
            type: ins.type,
            startDate: ins.start_date,
            endDate: ins.end_date,
            premiumAmount: ins.premium_amount,
            coverageDetails: ins.coverage_details,
        })).sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()),
        accidents: (vehicleResponse.accidents || []).map((acc: any) => ({
            id: acc.id,
            accidentDate: acc.accident_date,
            description: acc.description,
            severity: acc.severity,
            repairCost: acc.repair_cost,
        })).sort((a: any, b: any) => new Date(b.accidentDate).getTime() - new Date(a.accidentDate).getTime()),
        createdAt: vehicleResponse.created_at,
        updatedAt: vehicleResponse.updated_at,
    };

    return <VehicleDetailClient vehicle={vehicle} />;
}
