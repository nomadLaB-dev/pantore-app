import { NextResponse } from 'next/server';
import {
    mockClients, mockDeals, mockDealAssignees,
    mockInvoices, mockContracts, mockMinutes,
} from '@/lib/mock-data';

function enrich(d: typeof mockDeals[0]) {
    const assignees = mockDealAssignees
        .filter((a) => a.dealId === d.id)
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    return {
        ...d,
        client: mockClients.find((c) => c.id === d.clientId) ?? null,
        currentAssignee: assignees[0] ?? null,
        assigneeHistory: assignees,
        invoices: mockInvoices.filter((i) => i.dealId === d.id),
        contracts: mockContracts.filter((c) => c.dealId === d.id),
        minutes: mockMinutes.filter((m) => m.dealId === d.id),
    };
}

export async function GET() {
    return NextResponse.json(mockDeals.map(enrich));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newDeal = { ...body, id: `d_${Date.now()}`, status: 'active', createdAt: new Date() };
        mockDeals.push(newDeal);
        return NextResponse.json(newDeal, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
