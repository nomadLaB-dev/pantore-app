import { NextResponse } from 'next/server';
import { mockVehicleInsurances } from '@/lib/mocks/assets';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string, insuranceId: string }> }) {
    const { insuranceId } = await params;
    try {
        const body = await req.json();
        const index = mockVehicleInsurances.findIndex(i => i.id === insuranceId);
        if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        mockVehicleInsurances[index] = {
            ...mockVehicleInsurances[index],
            ...body,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            premiumAmount: body.premiumAmount ? Number(body.premiumAmount) : null,
        };
        return NextResponse.json(mockVehicleInsurances[index]);
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string, insuranceId: string }> }) {
    const { insuranceId } = await params;
    const index = mockVehicleInsurances.findIndex(i => i.id === insuranceId);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    mockVehicleInsurances.splice(index, 1);
    return NextResponse.json({ success: true });
}
