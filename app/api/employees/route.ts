import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mockEmployees, getLatestHistory } from '@/lib/mocks/employees';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const employees = includeArchived ? mockEmployees : mockEmployees.filter((e) => !e.leaveDate);

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: dbBranches } = await supabase.from('branches').select('*');
    const branches = dbBranches || [];

    const result = employees.map((e) => {
        const latest = getLatestHistory(e.id);
        return {
            ...e,
            branch: branches.find((b: { id: string, name: string }) => b.id === e.branchId) ?? null,
            currentSalary: latest?.salary ?? null,
            currentSalaryType: latest?.salaryType ?? null,
            currentContractEnd: latest?.contractEndDate ?? null,
            currentRenewalPlanned: latest?.renewalPlanned ?? false,
            currentPrimaryBranch: branches.find((b: { id: string, name: string }) => b.id === latest?.primaryBranchId) ?? null,
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
