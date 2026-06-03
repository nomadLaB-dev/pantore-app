import { createClient } from '@/lib/supabase/server';
import { RealEstatesClient } from './real-estates-client';

export default async function RealEstatesPage() {
    const supabase = await createClient();

    // 並行してマスタデータと不動産リストを取得する
    const [
        realEstatesRes,
        tenantsRes,
        branchesRes,
        usageTypesRes,
        regStatusesRes
    ] = await Promise.all([
        supabase.from('real_estates').select(`
            *,
            usages:real_estate_usages(*),
            contracts:real_estate_contracts(*),
            rest_facilities:real_estates_rest_facilities(*),
            garages:real_estates_garages(*)
        `).order('created_at', { ascending: false }),
        supabase.from('tenants').select('id, name').order('name'),
        supabase.from('branches').select('id, name').order('name'),
        supabase.from('usage_type_values').select('value'),
        supabase.from('office_registration_status_values').select('value')
    ]);

    if (realEstatesRes.error) console.error("Failed to fetch real estates:", realEstatesRes.error);
    if (tenantsRes.error) console.error("Failed to fetch tenants:", tenantsRes.error);
    if (branchesRes.error) console.error("Failed to fetch branches:", branchesRes.error);
    if (usageTypesRes.error) console.error("Failed to fetch usage types:", usageTypesRes.error);
    if (regStatusesRes.error) console.error("Failed to fetch registration statuses:", regStatusesRes.error);

    // データの正規化
    const estates = (realEstatesRes.data || []).map((r: any) => {
        const contractRaw = Array.isArray(r.contracts) ? r.contracts[0] : r.contracts;
        const restRaw = Array.isArray(r.rest_facilities) ? r.rest_facilities[0] : r.rest_facilities;
        const garageRaw = Array.isArray(r.garages) ? r.garages[0] : r.garages;

        return {
            id: r.id,
            tenantId: r.tenant_id,
            branchesId: r.branches_id,
            officeRegistrationStatus: r.office_registration_status,
            name: r.name,
            address: r.address,
            ownershipType: r.ownership_type,
            usages: Array.isArray(r.usages) ? r.usages.map((u: any) => ({
                id: u.id,
                type: u.usage_type,
                floorArea: u.floor_area
            })) : [],
            contract: contractRaw ? {
                landlord: contractRaw.landlord,
                monthlyRent: contractRaw.monthly_rent,
                startDate: contractRaw.start_date,
                endDate: contractRaw.end_date
            } : null,
            restFacility: restRaw ? {
                id: restRaw.id,
                isAttachedToOffice: restRaw.is_attached_to_office,
                address: restRaw.address,
                landlord: restRaw.landlord,
                monthlyRent: restRaw.monthly_rent,
                startDate: restRaw.start_date,
                endDate: restRaw.end_date
            } : null,
            garage: garageRaw ? {
                id: garageRaw.id,
                isAttachedToOffice: garageRaw.is_attached_to_office,
                address: garageRaw.address,
                landlord: garageRaw.landlord,
                monthlyRent: garageRaw.monthly_rent,
                capacity: garageRaw.capacity,
                startDate: garageRaw.start_date,
                endDate: garageRaw.end_date
            } : null
        };
    });

    const stats = {
        totalEstates: estates.length,
        leasedCount: estates.filter((e: any) => e.ownershipType === 'leased').length,
        ownedCount: estates.filter((e: any) => e.ownershipType === 'owned').length
    };

    const masters = {
        tenants: tenantsRes.data || [],
        branches: branchesRes.data || [],
        usageTypes: (usageTypesRes.data || []).map((u: any) => u.value),
        registrationStatuses: (regStatusesRes.data || []).map((s: any) => s.value)
    };

    return <RealEstatesClient estates={estates} stats={stats} masters={masters} />;
}
