import { NextResponse } from 'next/server';
import { mockBranches, mockEmployees } from '@/lib/mocks/employees';
import { mockSubscriptionPriceHistory, mockSubscriptions, getLatestPrice } from '@/lib/mocks/subscriptions';

export async function GET() {
    const withRelations = mockSubscriptions.map((s) => {
        const latest = getLatestPrice(s.id);
        return {
            ...s,
            currentAmount: latest?.amount ?? null,
            currentCurrency: latest?.currency ?? s.currentCurrency,
            branch: mockBranches.find((b) => b.id === s.branchId) ?? null,
            assignee: mockEmployees.find((e) => e.id === s.assigneeEmployeeId) ?? null,
            priceHistoryCount: mockSubscriptionPriceHistory.filter((h) => h.subscriptionId === s.id).length,
        };
    });
    return NextResponse.json(withRelations);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newSub = { ...body, id: `s_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
        return NextResponse.json(newSub, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
