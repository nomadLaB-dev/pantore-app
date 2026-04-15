import { NextResponse } from 'next/server';
import { mockClients, mockDeals, mockInvoices, mockContracts } from '@/lib/mocks/deals';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = mockClients.find((c) => c.id === id);
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const deals = mockDeals.filter((d) => d.clientId === id);
    const dealIds = deals.map((d) => d.id);
    const invoices = mockInvoices.filter((i) => dealIds.includes(i.dealId));
    const contracts = mockContracts.filter((c) => dealIds.includes(c.dealId));

    return NextResponse.json({ ...client, deals, invoices, contracts });
}
