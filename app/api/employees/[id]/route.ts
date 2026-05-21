import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // employees テーブルから特定のIDのレコードを取得（外部結合で branch/tenant も取得）
        const { data: employee, error } = await supabase
            .from('employees')
            .select(`
                *,
                branch:branches(*),
                tenant:tenants(*)
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
            name_kana: employee.user_name_kana,
            lastName: employee.last_name,
            firstName: employee.first_name,
            email: employee.email,
            tel: employee.tel,
            lineId: employee.line_id,
            address: employee.address,
            emergencyContact: employee.emergency_contact,
            birthDate: employee.birthday,
            companyId: employee.tenant_id,
            tenant: employee.tenant,
            hireDate: employee.hire_date,
            leaveDate: employee.leave_date,
            accountStatus: employee.account_status,
            branchId: employee.branch_id,
            branch: employee.branch,
            currentEmploymentCategory: employee.employment_category,
            currentSalary: employee.hourly_rate ?? null,
            currentSalaryType: employee.hourly_rate ? 'hourly' : null,
            weeklyHoursMin: employee.contracted_hours_per_week_min,
            weeklyHoursMax: employee.contracted_hours_per_week_max,
            certificationNum: employee.certification_num,
            invoiceNum: employee.invoice,
            currentContractEnd: null,
            currentRenewalPlanned: false,
            currentPrimaryBranch: employee.branch,
            currentAssignmentNote: null,
            proficiencyRate: employee.proficiency_rate,
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
        if (body.accountStatus !== undefined) updateData.account_status = body.accountStatus;
        if (body.name !== undefined) {
            updateData.name = body.name;
            const parts = body.name.trim().split(/[\s　]+/);
            updateData.last_name = parts[0] || '';
            updateData.first_name = parts.slice(1).join(' ') || '';
        }
        if (body.name_kana !== undefined) updateData.user_name_kana = body.name_kana;
        if (body.birthDate !== undefined) updateData.birthday = body.birthDate || null;
        if (body.companyId !== undefined) updateData.tenant_id = body.companyId;
        if (body.branchId !== undefined) updateData.branch_id = body.branchId || null;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.tel !== undefined) updateData.tel = body.tel;
        if (body.address !== undefined) updateData.address = body.address || '';
        if (body.emergencyContact !== undefined) updateData.emergency_contact = body.emergencyContact || '';
        if (body.hireDate !== undefined) updateData.hire_date = body.hireDate;
        if (body.leaveDate !== undefined) updateData.leave_date = body.leaveDate || null;
        if (body.category !== undefined) updateData.employment_category = body.category;
        if (body.hourlyRate !== undefined) updateData.hourly_rate = body.hourlyRate ? Number(body.hourlyRate) : null;
        if (body.weeklyHoursMin !== undefined) updateData.contracted_hours_per_week_min = body.weeklyHoursMin ? Number(body.weeklyHoursMin) : 0;
        if (body.weeklyHoursMax !== undefined) updateData.contracted_hours_per_week_max = body.weeklyHoursMax ? Number(body.weeklyHoursMax) : 0;
        if (body.invoiceNum !== undefined) updateData.invoice = body.invoiceNum || null;
        if (body.certificationNum !== undefined) updateData.certification_num = body.certificationNum || null;
        if (body.lineId !== undefined) updateData.line_id = body.lineId || null;
        if (body.proficiencyRate !== undefined) updateData.proficiency_rate = body.proficiencyRate ? Number(body.proficiencyRate) : null;

        const { data: employee, error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                branch:branches(*),
                tenant:tenants(*)
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
            name_kana: employee.user_name_kana,
            lastName: employee.last_name,
            firstName: employee.first_name,
            email: employee.email,
            tel: employee.tel,
            lineId: employee.line_id,
            address: employee.address,
            emergencyContact: employee.emergency_contact,
            birthDate: employee.birthday,
            companyId: employee.tenant_id,
            tenant: employee.tenant,
            hireDate: employee.hire_date,
            leaveDate: employee.leave_date,
            accountStatus: employee.account_status,
            branchId: employee.branch_id,
            branch: employee.branch,
            currentEmploymentCategory: employee.employment_category,
            currentSalary: employee.hourly_rate ?? null,
            currentSalaryType: employee.hourly_rate ? 'hourly' : null,
            weeklyHoursMin: employee.contracted_hours_per_week_min,
            weeklyHoursMax: employee.contracted_hours_per_week_max,
            certificationNum: employee.certification_num,
            invoiceNum: employee.invoice,
            currentContractEnd: null,
            currentRenewalPlanned: false,
            currentPrimaryBranch: employee.branch,
            currentAssignmentNote: null,
            proficiencyRate: employee.proficiency_rate,
        };

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('PUT /api/employees/[id] error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
