import { NextResponse } from 'next/server';
import { mockBranches } from '../employees/route';

export async function GET() {
    return NextResponse.json(mockBranches);
}
