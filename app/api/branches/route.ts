import { NextResponse } from 'next/server';
import { mockBranches } from '@/lib/mocks/employees';

export async function GET() {
    return NextResponse.json(mockBranches);
}
