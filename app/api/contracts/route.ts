import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    // Fetch vehicle leases
    const { data: vehicleLeases, error: vError } = await supabase
        .from('vehicle_leases')
        .select(`
            id,
            vehicle_id,
            lease_company,
            contract_start_date,
            contract_end_date,
            monthly_fee,
            vehicles(id, manufacturer, model, license_plate)
        `);

    if (vError) {
        console.error("Failed to fetch vehicle leases:", vError);
    }

    // Fetch real estate contracts
    const { data: realEstateContracts, error: rError } = await supabase
        .from('real_estate_contracts')
        .select(`
            id,
            real_estate_id,
            start_date,
            end_date,
            alert_days_before,
            monthly_rent,
            landlord,
            real_estates(id, name)
        `);

    if (rError) {
        console.error("Failed to fetch real estate contracts:", rError);
    }

    const allContracts: any[] = [];

    if (vehicleLeases) {
        for (const vl of vehicleLeases) {
            const v = Array.isArray(vl.vehicles) ? vl.vehicles[0] : vl.vehicles;
            allContracts.push({
                id: vl.id,
                relatedType: 'vehicle',
                relatedId: v?.id || vl.vehicle_id,
                relatedName: v ? `${v.manufacturer} ${v.model}（${v.license_plate}）` : '不明な車両',
                startDate: vl.contract_start_date,
                endDate: vl.contract_end_date,
                alertDaysBefore: 60,
                monthlyFee: vl.monthly_fee,
                counterparty: vl.lease_company,
            });
        }
    }

    if (realEstateContracts) {
        for (const rc of realEstateContracts) {
            const r = Array.isArray(rc.real_estates) ? rc.real_estates[0] : rc.real_estates;
            allContracts.push({
                id: rc.id,
                relatedType: 'real_estate',
                relatedId: r?.id || rc.real_estate_id,
                relatedName: r?.name || '不明な不動産',
                startDate: rc.start_date,
                endDate: rc.end_date,
                alertDaysBefore: rc.alert_days_before || 90,
                monthlyFee: rc.monthly_rent,
                counterparty: rc.landlord,
            });
        }
    }

    const now = new Date();
    const withDaysLeft = allContracts.map((c) => {
        const daysLeft = Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, daysLeft };
    });

    return NextResponse.json(withDaysLeft.sort((a, b) => a.daysLeft - b.daysLeft));
}
