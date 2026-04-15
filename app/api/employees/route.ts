import { NextResponse } from 'next/server';
import { mockEmployees, mockBranches, getLatestHistory } from '@/lib/mocks/employees';

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
