import { NextResponse } from 'next/server';
import { mockSubscriptionPriceHistory, mockSubscriptions } from '@/lib/mocks/subscriptions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sub = mockSubscriptions.find((s) => s.id === id);
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const history = mockSubscriptionPriceHistory
        .filter((h) => h.subscriptionId === id)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    return NextResponse.json({ ...sub, priceHistory: history });
}
