import { NextResponse } from 'next/server';
import { mockVehicles } from '../vehicles/route';
import { mockRealEstates } from '../real-estates/route';

// Aggregate all contracts from vehicles (leases) and real estates
const allContracts = [
    ...mockVehicles
        .filter((v) => v.lease)
        .map((v) => ({
            id: v.lease!.id,
            relatedType: 'vehicle' as const,
            relatedId: v.id,
            relatedName: `${v.manufacturer} ${v.model}（${v.licensePlate}）`,
            startDate: v.lease!.contractStartDate,
            endDate: v.lease!.contractEndDate,
            alertDaysBefore: 60,
            monthlyFee: v.lease!.monthlyFee,
            counterparty: v.lease!.leaseCompany,
        })),
    ...mockRealEstates
        .filter((r) => r.contract)
        .map((r) => ({
            id: r.contract!.id,
            relatedType: 'real_estate' as const,
            relatedId: r.id,
            relatedName: r.asset.name,
            startDate: r.contract!.startDate,
            endDate: r.contract!.endDate,
            alertDaysBefore: r.contract!.alertDaysBefore,
            monthlyFee: r.contract!.monthlyRent,
            counterparty: r.contract!.landlord,
        })),
];

export async function GET() {
    const now = new Date();
    const withDaysLeft = allContracts.map((c) => {
        const daysLeft = Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, daysLeft };
    });
    return NextResponse.json(withDaysLeft.sort((a, b) => a.daysLeft - b.daysLeft));
}
