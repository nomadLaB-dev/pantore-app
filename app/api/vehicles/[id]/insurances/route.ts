import { NextResponse } from 'next/server';
import { mockVehicleInsurances } from '@/lib/mocks/assets';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const newInsurance = {
            id: `vi_${Date.now()}`,
            vehicleId: id,
            ...body,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
        };
        mockVehicleInsurances.push(newInsurance);
        return NextResponse.json(newInsurance, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
