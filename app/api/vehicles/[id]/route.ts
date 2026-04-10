import { NextResponse } from 'next/server';
import { mockVehicles } from '../route';
import { mockBranches } from '../../employees/route';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const vehicle = mockVehicles.find((v) => v.id === id);
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
        ...vehicle,
        branch: mockBranches.find((b) => b.id === vehicle.branchId) ?? null,
    });
}
