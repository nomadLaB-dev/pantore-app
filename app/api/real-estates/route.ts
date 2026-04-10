import { NextResponse } from 'next/server';

export const mockRealEstates = [
    {
        id: 're1',
        assetId: 'ra1',
        address: '東京都新宿区西新宿2-8-1 スカイビル 5F',
        ownershipType: 'leased' as const,
        asset: { id: 'ra1', name: '西新宿オフィス', type: 'real_estate' as const, createdAt: new Date('2020-04-01') },
        contract: {
            id: 'c1',
            relatedType: 'real_estate' as const,
            relatedId: 're1',
            startDate: new Date('2020-04-01'),
            endDate: new Date('2026-03-31'),
            alertDaysBefore: 90,
            monthlyRent: 280000,
            landlord: '株式会社西新宿不動産',
        },
        usages: [
            { id: 'u1', type: '本社オフィス', floorArea: 120 },
        ],
    },
    {
        id: 're2',
        assetId: 'ra2',
        address: '大阪府大阪市北区梅田1-3-1 大阪駅前ビル 12F',
        ownershipType: 'leased' as const,
        asset: { id: 'ra2', name: '大阪支社', type: 'real_estate' as const, createdAt: new Date('2022-07-01') },
        contract: {
            id: 'c2',
            relatedType: 'real_estate' as const,
            relatedId: 're2',
            startDate: new Date('2022-07-01'),
            endDate: new Date('2027-06-30'),
            alertDaysBefore: 60,
            monthlyRent: 150000,
            landlord: '梅田商事株式会社',
        },
        usages: [{ id: 'u2', type: '営業拠点', floorArea: 65 }],
    },
    {
        id: 're3',
        assetId: 'ra3',
        address: '神奈川県横浜市西区みなとみらい3-6-3',
        ownershipType: 'owned' as const,
        asset: { id: 'ra3', name: '横浜倉庫', type: 'real_estate' as const, createdAt: new Date('2018-01-15') },
        contract: null,
        usages: [{ id: 'u3', type: '物品倉庫', floorArea: 300 }],
    },
];

export async function GET() {
    return NextResponse.json(mockRealEstates);
}
