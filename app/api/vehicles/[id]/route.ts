import { NextResponse } from 'next/server';
import { mockVehicles, mockVehicleInsurances } from '@/lib/mocks/assets';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const vehicle = mockVehicles.find((v) => v.id === id);
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const insurances = mockVehicleInsurances.filter((i) => i.vehicleId === id);
    return NextResponse.json({ ...vehicle, insurances });
}
