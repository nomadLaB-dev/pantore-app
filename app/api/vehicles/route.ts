import { NextResponse } from 'next/server';
import { mockBranches } from '../employees/route';

export const mockVehicles = [
    {
        id: 'v1', assetId: 'a1',
        ownershipType: 'leased' as const,
        manufacturer: 'トヨタ', model: 'ノア',
        licensePlate: '品川300あ1234',
        licensePlateColor: 'white' as const,
        branchId: 'b1',
        asset: { id: 'a1', name: 'トヨタ ノア', type: 'vehicle' as const, createdAt: new Date('2022-04-01') },
        lease: {
            id: 'vl1', vehicleId: 'v1',
            leaseCompany: 'オリックス自動車',
            contractStartDate: new Date('2022-04-01'),
            contractEndDate: new Date('2026-04-24'),
            monthlyFee: 55000,
        },
        depreciation: null,
        accidents: [
            { id: 'acc1', vehicleId: 'v1', employeeId: 'emp_1', accidentDate: new Date('2024-08-15'), description: '駐車場内での接触事故', severity: 'low' as const },
        ],
    },
    {
        id: 'v2', assetId: 'a2',
        ownershipType: 'owned' as const,
        manufacturer: 'ホンダ', model: 'フィット',
        licensePlate: '練馬500さ5678',
        licensePlateColor: 'yellow' as const,
        branchId: 'b2',
        asset: { id: 'a2', name: 'ホンダ フィット', type: 'vehicle' as const, createdAt: new Date('2021-01-15') },
        lease: null,
        depreciation: {
            acquisitionCost: 1650000,       // 購入価額（本体＋付帯費用）
            bodyType: 'passenger_compact' as const,  // 軽自動車 → 耐用4年
            isNewCar: false,
            purchaseDate: new Date('2021-01-15'),
            firstRegistrationDate: new Date('2018-09-01'), // 初度登録（約2年4ヶ月落ち）
        },
        accidents: [],
    },
    {
        id: 'v3', assetId: 'a3',
        ownershipType: 'leased' as const,
        manufacturer: '日産', model: 'セレナ',
        licensePlate: '横浜330い9012',
        licensePlateColor: 'white' as const,
        branchId: 'b3',
        asset: { id: 'a3', name: '日産 セレナ', type: 'vehicle' as const, createdAt: new Date('2023-09-01') },
        lease: {
            id: 'vl3', vehicleId: 'v3',
            leaseCompany: '三井住友ファイナンス',
            contractStartDate: new Date('2023-09-01'),
            contractEndDate: new Date('2026-08-31'),
            monthlyFee: 65000,
        },
        depreciation: null,
        accidents: [
            { id: 'acc2', vehicleId: 'v3', employeeId: null, accidentDate: new Date('2025-01-22'), description: '雪道でのスリップ', severity: 'medium' as const },
        ],
    },
    {
        id: 'v4', assetId: 'a4',
        ownershipType: 'owned' as const,
        manufacturer: 'スズキ', model: 'エブリイ',
        licensePlate: '大阪480む3456',
        licensePlateColor: 'green' as const,
        branchId: 'b2',
        asset: { id: 'a4', name: 'スズキ エブリイ', type: 'vehicle' as const, createdAt: new Date('2020-06-01') },
        lease: null,
        depreciation: {
            acquisitionCost: 1980000,
            bodyType: 'truck_general' as const,  // 軽バン（一般貨物）→ 耐用5年
            isNewCar: true,
            purchaseDate: new Date('2020-06-01'),
            firstRegistrationDate: new Date('2020-06-01'),
        },
        accidents: [],
    },
];

export async function GET() {
    const result = mockVehicles.map((v) => ({
        ...v,
        branch: mockBranches.find((b) => b.id === v.branchId) ?? null,
    }));
    return NextResponse.json(result);
}
