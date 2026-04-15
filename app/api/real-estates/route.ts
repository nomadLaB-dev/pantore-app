import { NextResponse } from 'next/server';
import { mockRealEstates } from '@/lib/mocks/assets';

export async function GET() {
    return NextResponse.json(mockRealEstates);
}
