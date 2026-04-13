import { NextResponse } from 'next/server';

export const mockClients = [
    {
        id: 'cl_1',
        companyName: '株式会社サンライズフード',
        department: '食品事業部',
        contactName: '田村 誠司',
        contactEmail: 'tamura@sunrise-food.co.jp',
        contactPhone: '03-1234-5678',
        billingName: '田村 誠司',
        billingEmail: 'billing@sunrise-food.co.jp',
        billingAddress: '東京都港区南青山2-2-15',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        id: 'cl_2',
        companyName: '合同会社ベーカリーデジタル',
        department: 'ITソリューション部',
        contactName: '松本 菜々子',
        contactEmail: 'matsumoto@bakery-digital.jp',
        contactPhone: '06-9876-5432',
        billingName: '経理部 宛',
        billingEmail: 'accounting@bakery-digital.jp',
        billingAddress: '大阪府大阪市北区梅田3-1-3',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-06-01'),
    },
    {
        id: 'cl_3',
        companyName: 'グリーンフィールド農産株式会社',
        department: '調達・購買部',
        contactName: '中野 拓也',
        contactEmail: 'nakano@greenfield-agri.jp',
        contactPhone: '045-111-2222',
        billingName: '中野 拓也',
        billingEmail: 'nakano@greenfield-agri.jp',
        billingAddress: '神奈川県横浜市中区本町4-44',
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20'),
    },
];

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
