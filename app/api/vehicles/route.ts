import { NextResponse } from 'next/server';
import { mockBranches } from '@/lib/mocks/employees';
import { mockVehicles } from '@/lib/mocks/assets';

export async function GET() {
    const result = mockVehicles.map((v) => ({
        ...v,
        branch: mockBranches.find((b) => b.id === v.branchId) ?? null,
    }));
    return NextResponse.json(result);
}
