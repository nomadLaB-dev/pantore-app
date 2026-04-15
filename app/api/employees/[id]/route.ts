import { NextResponse } from 'next/server';
import { mockEmployees } from '@/lib/mocks/employees';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const emp = mockEmployees.find((e) => e.id === id);
    if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(emp);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    // Mock: just echo back with updated fields
    const emp = mockEmployees.find((e) => e.id === id);
    if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ...emp, ...body, updatedAt: new Date() });
}
