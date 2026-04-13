import { NextResponse } from 'next/server';
import {
    mockClients, mockDeals, mockDealAssignees,
    mockInvoices, mockContracts, mockMinutes,
} from '@/lib/mock-data';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const deal = mockDeals.find((d) => d.id === id);
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const assignees = mockDealAssignees
        .filter((a) => a.dealId === id)
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

    return NextResponse.json({
        ...deal,
        client: mockClients.find((c) => c.id === deal.clientId) ?? null,
        currentAssignee: assignees[0] ?? null,
        assigneeHistory: assignees,
        invoices: mockInvoices.filter((i) => i.dealId === id),
        contracts: mockContracts.filter((c) => c.dealId === id),
        minutes: mockMinutes.filter((m) => m.dealId === id),
    });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const idx = mockDeals.findIndex((d) => d.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    Object.assign(mockDeals[idx], body);
    return NextResponse.json(mockDeals[idx]);
}
