import { NextResponse } from 'next/server';
import { Employee, EmploymentTypeHistory, Branch } from '@/types';

export const mockBranches: Branch[] = [
    { id: 'b1', name: '本社', address: '東京都新宿区西新宿2-8-1' },
    { id: 'b2', name: '大阪支社', address: '大阪府大阪市北区梅田1-3-1' },
    { id: 'b3', name: '横浜倉庫・拠点', address: '神奈川県横浜市西区みなとみらい3-6-3' },
];

// Current date reference: 2026-04-13
export const mockEmploymentHistory: EmploymentTypeHistory[] = [
    // 山田 太郎: パート（本社） → 正社員（本社・営業部）
    {
        id: 'eth_1', employeeId: 'emp_1', category: 'part_time',
        startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'),
        salary: 1100, salaryType: 'hourly',
        contractStartDate: new Date('2023-04-01'), contractEndDate: new Date('2024-03-31'), renewalPlanned: false,
        primaryBranchId: 'b1', assignmentNote: '営業補佐',
    },
    {
        id: 'eth_2', employeeId: 'emp_1', category: 'full_time',
        startDate: new Date('2024-04-01'), endDate: null,
        salary: 280000, salaryType: 'monthly',
        contractStartDate: null, contractEndDate: null, renewalPlanned: false,
        primaryBranchId: 'b1', assignmentNote: '営業部・第1グループ',
    },

    // 佐藤 花子: 契約社員（大阪） → 正社員（本社・企画部）
    {
        id: 'eth_3', employeeId: 'emp_2', category: 'contract',
        startDate: new Date('2021-10-15'), endDate: new Date('2022-10-14'),
        salary: 220000, salaryType: 'monthly',
        contractStartDate: new Date('2021-10-15'), contractEndDate: new Date('2022-10-14'), renewalPlanned: false,
        primaryBranchId: 'b2', assignmentNote: '大阪支社 企画担当',
    },
    {
        id: 'eth_4', employeeId: 'emp_2', category: 'full_time',
        startDate: new Date('2022-10-15'), endDate: null,
        salary: 4200000, salaryType: 'annual',
        contractStartDate: null, contractEndDate: null, renewalPlanned: false,
        primaryBranchId: 'b1', assignmentNote: '本社 企画部リーダー',
    },

    // 鈴木 一郎: 派遣（横浜） → パート（大阪、契約期限近い）
    {
        id: 'eth_5', employeeId: 'emp_3', category: 'dispatch',
        startDate: new Date('2024-01-10'), endDate: new Date('2024-12-31'),
        salary: 1800, salaryType: 'hourly',
        contractStartDate: new Date('2024-01-10'), contractEndDate: new Date('2024-12-31'), renewalPlanned: false,
        primaryBranchId: 'b3', assignmentNote: '横浜倉庫 ピッキング',
    },
    {
        id: 'eth_6', employeeId: 'emp_3', category: 'part_time',
        startDate: new Date('2025-01-01'), endDate: null,
        salary: 1200, salaryType: 'hourly',
        contractStartDate: new Date('2025-01-01'), contractEndDate: new Date('2026-06-30'), renewalPlanned: false,
        primaryBranchId: 'b2', assignmentNote: '大阪支社 倉庫補助',
    },

    // 田中 美咲: 契約社員（本社）更新予定あり
    {
        id: 'eth_7', employeeId: 'emp_5', category: 'contract',
        startDate: new Date('2025-06-01'), endDate: null,
        salary: 250000, salaryType: 'monthly',
        contractStartDate: new Date('2025-06-01'), contractEndDate: new Date('2026-05-31'), renewalPlanned: true,
        primaryBranchId: 'b1', assignmentNote: '本社 経理担当',
    },

    // 木村 健: 契約社員（大阪）期限迫る
    {
        id: 'eth_8', employeeId: 'emp_6', category: 'contract',
        startDate: new Date('2025-05-15'), endDate: null,
        salary: 230000, salaryType: 'monthly',
        contractStartDate: new Date('2025-05-15'), contractEndDate: new Date('2026-05-15'), renewalPlanned: false,
        primaryBranchId: 'b2', assignmentNote: '大阪支社 システム管理',
    },

    // 高橋 健太（退職済）
    {
        id: 'eth_9', employeeId: 'emp_4', category: 'full_time',
        startDate: new Date('2022-06-01'), endDate: new Date('2025-12-31'),
        salary: 350000, salaryType: 'monthly',
        contractStartDate: null, contractEndDate: null, renewalPlanned: false,
        primaryBranchId: 'b1', assignmentNote: '本社 総務部長',
    },
];

const getLatestHistory = (employeeId: string) => {
    const hist = mockEmploymentHistory
        .filter((h) => h.employeeId === employeeId)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return hist[0] ?? null;
};

export const mockEmployees: (Employee & { branchId: string | null })[] = [
    {
        id: 'emp_1', name: '山田 太郎', email: 'taro.yamada@pantore.test',
        hireDate: new Date('2023-04-01'), leaveDate: null,
        accountStatus: 'active', currentEmploymentCategory: getLatestHistory('emp_1')?.category,
        branchId: 'b1', createdAt: new Date('2023-04-01'), updatedAt: new Date('2024-04-01'),
    },
    {
        id: 'emp_2', name: '佐藤 花子', email: 'hanako.sato@pantore.test',
        hireDate: new Date('2021-10-15'), leaveDate: null,
        accountStatus: 'active', currentEmploymentCategory: getLatestHistory('emp_2')?.category,
        branchId: 'b1', createdAt: new Date('2021-10-15'), updatedAt: new Date('2022-10-15'),
    },
    {
        id: 'emp_3', name: '鈴木 一郎', email: 'ichiro.suzuki@pantore.test',
        hireDate: new Date('2024-01-10'), leaveDate: null,
        accountStatus: 'active', currentEmploymentCategory: getLatestHistory('emp_3')?.category,
        branchId: 'b2', createdAt: new Date('2024-01-10'), updatedAt: new Date('2025-01-01'),
    },
    {
        id: 'emp_4', name: '高橋 健太', email: 'kenta.takahashi@pantore.test',
        hireDate: new Date('2022-06-01'), leaveDate: new Date('2025-12-31'),
        accountStatus: 'none', currentEmploymentCategory: getLatestHistory('emp_4')?.category,
        branchId: 'b1', createdAt: new Date('2022-06-01'), updatedAt: new Date('2025-01-01'),
    },
    {
        id: 'emp_5', name: '田中 美咲', email: 'misaki.tanaka@pantore.test',
        hireDate: new Date('2025-06-01'), leaveDate: null,
        accountStatus: 'active', currentEmploymentCategory: getLatestHistory('emp_5')?.category,
        branchId: 'b1', createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01'),
    },
    {
        id: 'emp_6', name: '木村 健', email: 'ken.kimura@pantore.test',
        hireDate: new Date('2025-05-15'), leaveDate: null,
        accountStatus: 'active', currentEmploymentCategory: getLatestHistory('emp_6')?.category,
        branchId: 'b2', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15'),
    },
];

export async function GET(req: Request) {
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const employees = includeArchived ? mockEmployees : mockEmployees.filter((e) => !e.leaveDate);

    const result = employees.map((e) => {
        const latest = getLatestHistory(e.id);
        return {
            ...e,
            branch: mockBranches.find((b) => b.id === e.branchId) ?? null,
            currentSalary: latest?.salary ?? null,
            currentSalaryType: latest?.salaryType ?? null,
            currentContractEnd: latest?.contractEndDate ?? null,
            currentRenewalPlanned: latest?.renewalPlanned ?? false,
            currentPrimaryBranch: mockBranches.find((b) => b.id === latest?.primaryBranchId) ?? null,
            currentAssignmentNote: latest?.assignmentNote ?? null,
        };
    });

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
