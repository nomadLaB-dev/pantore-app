import { NextResponse } from 'next/server';
import { mockBranches, mockEmployees } from '../employees/route';

export const mockSubscriptionPriceHistory = [
    // Notion
    { id: 'ph1', subscriptionId: 's1', amount: 2000, currency: 'JPY' as const, effectiveFrom: new Date('2023-04-01'), note: '初期契約' },
    { id: 'ph2', subscriptionId: 's1', amount: 2500, currency: 'JPY' as const, effectiveFrom: new Date('2024-04-01'), note: '料金改定' },
    // Slack
    { id: 'ph3', subscriptionId: 's2', amount: 7.25, currency: 'USD' as const, effectiveFrom: new Date('2022-10-01'), note: 'Pro plan' },
    { id: 'ph4', subscriptionId: 's2', amount: 8.75, currency: 'USD' as const, effectiveFrom: new Date('2024-01-01'), note: 'Pro plan 値上げ' },
    // Adobe CC
    { id: 'ph5', subscriptionId: 's3', amount: 6480, currency: 'JPY' as const, effectiveFrom: new Date('2023-11-01'), note: '単体プラン' },
    // GitHub
    { id: 'ph6', subscriptionId: 's4', amount: 4, currency: 'USD' as const, effectiveFrom: new Date('2023-01-15'), note: 'Team plan / seat' },
    { id: 'ph7', subscriptionId: 's4', amount: 4, currency: 'USD' as const, effectiveFrom: new Date('2024-06-01'), note: '価格据え置き' },
    // Google Workspace
    { id: 'ph8', subscriptionId: 's5', amount: 1360, currency: 'JPY' as const, effectiveFrom: new Date('2022-06-01'), note: 'Business Starter' },
    { id: 'ph9', subscriptionId: 's5', amount: 1700, currency: 'JPY' as const, effectiveFrom: new Date('2023-10-01'), note: 'Business Standard へ移行' },
];

const getLatestPrice = (subscriptionId: string) => {
    const hist = mockSubscriptionPriceHistory
        .filter((h) => h.subscriptionId === subscriptionId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    return hist[0] ?? null;
};

export const mockSubscriptions = [
    {
        id: 's1',
        serviceName: 'Notion',
        serviceUrl: 'https://notion.so',
        corporateName: 'Notion Labs, Inc.',
        branchId: 'b1',
        assigneeEmployeeId: 'emp_1',
        currentCurrency: 'JPY' as const,
        createdAt: new Date('2023-04-01'),
        updatedAt: new Date('2024-04-01'),
    },
    {
        id: 's2',
        serviceName: 'Slack',
        serviceUrl: 'https://slack.com',
        corporateName: 'Salesforce Japan 株式会社',
        branchId: 'b1',
        assigneeEmployeeId: 'emp_2',
        currentCurrency: 'USD' as const,
        createdAt: new Date('2022-10-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 's3',
        serviceName: 'Adobe Creative Cloud',
        serviceUrl: 'https://adobe.com',
        corporateName: 'アドビ株式会社',
        branchId: 'b2',
        assigneeEmployeeId: 'emp_3',
        currentCurrency: 'JPY' as const,
        createdAt: new Date('2023-11-01'),
        updatedAt: new Date('2023-11-01'),
    },
    {
        id: 's4',
        serviceName: 'GitHub Team',
        serviceUrl: 'https://github.com',
        corporateName: 'GitHub, Inc.',
        branchId: 'b1',
        assigneeEmployeeId: 'emp_1',
        currentCurrency: 'USD' as const,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-06-01'),
    },
    {
        id: 's5',
        serviceName: 'Google Workspace',
        serviceUrl: 'https://workspace.google.com',
        corporateName: 'グーグル合同会社',
        branchId: null,
        assigneeEmployeeId: 'emp_2',
        currentCurrency: 'JPY' as const,
        createdAt: new Date('2022-06-01'),
        updatedAt: new Date('2023-10-01'),
    },
];

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
