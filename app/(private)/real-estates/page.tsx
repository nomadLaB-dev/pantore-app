import { createClient } from '@/lib/supabase/server';
import { RealEstatesClient } from './real-estates-client';

export default async function RealEstatesPage() {
    const supabase = await createClient();

    // 不動産リストの取得
    const { data: realEstatesResponse, error } = await supabase
        .from('real_estates')
        .select(`
            *,
            usages:real_estate_usages(*),
            contracts:real_estate_contracts(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch real estates:", error);
    }

    // データの正規化
    const estates = (realEstatesResponse || []).map((r: any) => {
        const contractRaw = Array.isArray(r.contracts) ? r.contracts[0] : r.contracts;

        return {
            id: r.id,
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
            } : null
        };
    });

    const stats = {
        totalEstates: estates.length,
        leasedCount: estates.filter((e: any) => e.ownershipType === 'leased').length,
        ownedCount: estates.filter((e: any) => e.ownershipType === 'owned').length
    };

    return <RealEstatesClient estates={estates} stats={stats} />;
}
