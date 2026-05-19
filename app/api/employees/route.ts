import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const url = new URL(req.url);
        const includeArchived = url.searchParams.get('includeArchived') === 'true';

        // 1. employees テーブルから全件取得（外部結合で branch も取得）
        let query = supabase
            .from('employees')
            .select(`
                *,
                branch:branches(*)
            `);

        if (!includeArchived) {
            query = query.is('leave_date', null);
        }

        const { data: employees, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('GET /api/employees DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // フロントエンドの期待する型（キャメルケース）にマッピング
        const result = employees.map((e) => ({
            id: e.id,
            name: e.name,
            lastName: e.last_name,
            firstName: e.first_name,
            email: e.email,
            hireDate: e.hire_date,
            leaveDate: e.leave_date,
            accountStatus: e.account_status,
            branchId: e.branch_id,
            branch: e.branch,
            currentEmploymentCategory: e.employment_category,
            // 履歴テーブルは未実装なので、現状は従業員テーブルの値からマッピング
            currentSalary: e.hourly_rate ?? null,
            currentSalaryType: e.hourly_rate ? 'hourly' : null,
            currentContractEnd: null,
            currentRenewalPlanned: false,
            currentPrimaryBranch: e.branch,
            currentAssignmentNote: null,
        }));

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('GET /api/employees error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();

        // 姓名の分割（姓と名をスペースで分割して保存）
        let lastName = '';
        let firstName = '';
        if (body.name) {
            const parts = body.name.trim().split(/[\s　]+/);
            lastName = parts[0] || '';
            firstName = parts.slice(1).join(' ') || '';
        }

        // Supabase の `employees` テーブルへインサート
        const { data, error } = await supabase
            .from('employees')
            .insert({
                name: body.name,
                last_name: lastName,
                first_name: firstName,
                user_name_kana: body.name_kana,
                birthday: body.birthDate || null,
                tenant_id: body.companyId,
                branch_id: body.branchId || null,
                email: body.email,
                tel: body.tel,
                address: body.address || '',
                emergency_contact: body.emergencyContact || '',
                hire_date: body.hireDate,
                employment_category: body.category,
                hourly_rate: body.hourlyRate ? Number(body.hourlyRate) : null,
                contracted_hours_per_week_min: body.weeklyHoursMin ? Number(body.weeklyHoursMin) : 0,
                contracted_hours_per_week_max: body.weeklyHoursMax ? Number(body.weeklyHoursMax) : 0,
                account_status: 'none', // 新規登録時はアカウント未発行 ('none')
                invoice: body.invoiceNum || null,
                certification_num: body.certificationNum || null,
                line_id: body.lineId || null,
            })
            .select()
            .single();

        if (error) {
            console.error('POST /api/employees DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (e: any) {
        console.error('POST /api/employees error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
