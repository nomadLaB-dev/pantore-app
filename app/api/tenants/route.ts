import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (empError || !employee?.tenant_id) return NextResponse.json({ error: 'Tenant unassigned' }, { status: 403 });

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', employee.tenant_id)
            .single();

        if (error) throw error;
        return NextResponse.json(tenant);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (empError || !employee?.tenant_id) return NextResponse.json({ error: 'Tenant unassigned' }, { status: 403 });

        const body = await req.json();

        const { data, error } = await supabase
            .from('tenants')
            .update({
                name: body.name,
                billing_name: body.billingName,
                billing_email: body.billingEmail,
                billing_address: body.billingAddress,
            })
            .eq('id', employee.tenant_id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
