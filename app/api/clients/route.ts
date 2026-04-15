import { NextResponse } from 'next/server';
import { mockClients } from '@/lib/mocks/deals';

export async function GET() {
    return NextResponse.json(mockClients);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newClient = { ...body, id: `cl_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
        mockClients.push(newClient);
        return NextResponse.json(newClient, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
