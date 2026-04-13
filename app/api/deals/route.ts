import { NextResponse } from 'next/server';
import { mockClients } from '../clients/route';

export const mockDeals = [
    {
        id: 'd_1',
        clientId: 'cl_1',
        name: '食品管理システム 導入支援',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-07-31'),
        autoRenew: false,
        billingType: 'shot' as const,
        amount: 1500000,
        currency: 'JPY',
        status: 'completed' as const,
        notes: '初期導入フェーズ、定例MTX月2回',
        createdAt: new Date('2024-01-20'),
    },
    {
        id: 'd_2',
        clientId: 'cl_2',
        name: 'ECサイト運用保守',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        autoRenew: true,
        billingType: 'recurring' as const,
        amount: 120000,
        currency: 'JPY',
        status: 'active' as const,
        notes: '月額保守、SLA 99.5%',
        createdAt: new Date('2024-03-15'),
    },
    {
        id: 'd_3',
        clientId: 'cl_3',
        name: '農産物調達データ分析レポート',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-04-30'),
        autoRenew: false,
        billingType: 'shot' as const,
        amount: 480000,
        currency: 'JPY',
        status: 'active' as const,
        notes: '四半期ごとのデータ納品',
        createdAt: new Date('2025-01-25'),
    },
];

export async function GET() {
    const withClient = mockDeals.map((d) => ({
        ...d,
        client: mockClients.find((c) => c.id === d.clientId) ?? null,
    }));
    return NextResponse.json(withClient);
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
