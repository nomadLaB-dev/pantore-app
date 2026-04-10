import { NextResponse } from 'next/server';
import { mockSubscriptionPriceHistory, mockSubscriptions } from '../route';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sub = mockSubscriptions.find((s) => s.id === id);
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const history = mockSubscriptionPriceHistory
        .filter((h) => h.subscriptionId === id)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

    return NextResponse.json({ ...sub, priceHistory: history });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const newHistory = {
        id: `ph_${Date.now()}`,
        subscriptionId: id,
        ...body,
        effectiveFrom: new Date(body.effectiveFrom),
    };
    // In a real app this would persist to DB
    return NextResponse.json(newHistory, { status: 201 });
}
