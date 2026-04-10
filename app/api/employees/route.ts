import { NextResponse } from 'next/server';
import { Employee, EmploymentTypeHistory, Branch } from '@/types';

export const mockBranches: Branch[] = [
    { id: 'b1', name: '本社', address: '東京都新宿区西新宿2-8-1' },
    { id: 'b2', name: '大阪支社', address: '大阪府大阪市北区梅田1-3-1' },
    { id: 'b3', name: '横浜倉庫・拠点', address: '神奈川県横浜市西区みなとみらい3-6-3' },
];

export const mockEmploymentHistory: EmploymentTypeHistory[] = [
    // 山田 太郎: パート → 正社員
    { id: 'eth_1', employeeId: 'emp_1', category: 'part_time', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31') },
    { id: 'eth_2', employeeId: 'emp_1', category: 'full_time', startDate: new Date('2024-04-01'), endDate: null },
    // 佐藤 花子: 契約社員 → 正社員
    { id: 'eth_3', employeeId: 'emp_2', category: 'contract', startDate: new Date('2021-10-15'), endDate: new Date('2022-10-14') },
    { id: 'eth_4', employeeId: 'emp_2', category: 'full_time', startDate: new Date('2022-10-15'), endDate: null },
    // 鈴木 一郎: 派遣 → パート
    { id: 'eth_5', employeeId: 'emp_3', category: 'dispatch', startDate: new Date('2024-01-10'), endDate: new Date('2024-12-31') },
    { id: 'eth_6', employeeId: 'emp_3', category: 'part_time', startDate: new Date('2025-01-01'), endDate: null },
    // 高橋 健太（退職済）: 正社員のみ
    { id: 'eth_7', employeeId: 'emp_4', category: 'full_time', startDate: new Date('2022-06-01'), endDate: new Date('2025-12-31') },
];

const getLatestCategory = (employeeId: string) => {
    const hist = mockEmploymentHistory
        .filter((h) => h.employeeId === employeeId)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return hist[0]?.category;
};

export const mockEmployees: (Employee & { branchId: string | null })[] = [
    {
        id: 'emp_1', name: '山田 太郎', email: 'taro.yamada@pantore.test',
        hireDate: new Date('2023-04-01'), leaveDate: null,
        accountStatus: 'active',
        currentEmploymentCategory: getLatestCategory('emp_1'),
        branchId: 'b1',
        createdAt: new Date('2023-04-01'), updatedAt: new Date('2024-04-01'),
    },
    {
        id: 'emp_2', name: '佐藤 花子', email: 'hanako.sato@pantore.test',
        hireDate: new Date('2021-10-15'), leaveDate: null,
        accountStatus: 'active',
        currentEmploymentCategory: getLatestCategory('emp_2'),
        branchId: 'b1',
        createdAt: new Date('2021-10-15'), updatedAt: new Date('2022-10-15'),
    },
    {
        id: 'emp_3', name: '鈴木 一郎', email: 'ichiro.suzuki@pantore.test',
        hireDate: new Date('2024-01-10'), leaveDate: null,
        accountStatus: 'disabled',
        currentEmploymentCategory: getLatestCategory('emp_3'),
        branchId: 'b2',
        createdAt: new Date('2024-01-10'), updatedAt: new Date('2025-01-01'),
    },
    {
        id: 'emp_4', name: '高橋 健太', email: 'kenta.takahashi@pantore.test',
        hireDate: new Date('2022-06-01'), leaveDate: new Date('2025-12-31'),
        accountStatus: 'none',
        currentEmploymentCategory: getLatestCategory('emp_4'),
        branchId: 'b1',
        createdAt: new Date('2022-06-01'), updatedAt: new Date('2025-01-01'),
    },
];

export async function GET(req: Request) {
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    const employees = includeArchived
        ? mockEmployees
        : mockEmployees.filter((e) => !e.leaveDate);

    // Join branch name
    const result = employees.map((e) => ({
        ...e,
        branch: mockBranches.find((b) => b.id === e.branchId) ?? null,
    }));

    return NextResponse.json(result);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        return NextResponse.json({ ...body, id: `emp_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
