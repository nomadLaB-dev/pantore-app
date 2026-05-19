import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // employees テーブルから特定のIDのレコードを取得（外部結合で branch も取得）
        const { data: employee, error } = await supabase
            .from('employees')
            .select(`
                *,
                branch:branches(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('GET /api/employees/[id] DB error:', error);
            if (error.code === 'PGRST116') { // PostgREST: 0 rows returned
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // フロントエンドの期待する型（キャメルケース）にマッピング
        const result = {
            id: employee.id,
            name: employee.name,
            lastName: employee.last_name,
            firstName: employee.first_name,
            email: employee.email,
            hireDate: employee.hire_date,
            leaveDate: employee.leave_date,
            accountStatus: employee.account_status,
            branchId: employee.branch_id,
            branch: employee.branch,
            currentEmploymentCategory: employee.employment_category,
            currentSalary: employee.hourly_rate ?? null,
            currentSalaryType: employee.hourly_rate ? 'hourly' : null,
            currentContractEnd: null,
            currentRenewalPlanned: false,
            currentPrimaryBranch: employee.branch,
            currentAssignmentNote: null,
        };

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('GET /api/employees/[id] error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const supabase = await createClient();

        const updateData: any = {};
        if (body.accountStatus !== undefined) {
            updateData.account_status = body.accountStatus;
        }

        const { data: employee, error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                branch:branches(*)
            `)
            .single();

        if (error) {
            console.error('PUT /api/employees/[id] DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // フロントエンドの期待する型（キャメルケース）にマッピング
        const result = {
            id: employee.id,
            name: employee.name,
            lastName: employee.last_name,
            firstName: employee.first_name,
            email: employee.email,
            hireDate: employee.hire_date,
            leaveDate: employee.leave_date,
            accountStatus: employee.account_status,
            branchId: employee.branch_id,
            branch: employee.branch,
            currentEmploymentCategory: employee.employment_category,
            currentSalary: employee.hourly_rate ?? null,
            currentSalaryType: employee.hourly_rate ? 'hourly' : null,
            currentContractEnd: null,
            currentRenewalPlanned: false,
            currentPrimaryBranch: employee.branch,
            currentAssignmentNote: null,
        };

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('PUT /api/employees/[id] error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
