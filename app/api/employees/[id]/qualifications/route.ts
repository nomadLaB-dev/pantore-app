import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: qualifications, error } = await supabase
            .from('employee_qualifications')
            .select('*')
            .eq('employee_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('GET /api/employees/[id]/qualifications DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map database response (snake_case) to camelCase
        const result = qualifications.map((q: any) => ({
            employeeId: q.employee_id,
            qualification: q.qualification,
            qualificationStatus: q.qualification_status,
            acquiredDate: q.acquired_date,
            lastWorkDate: q.last_work_date,
            isActive: q.is_active,
            createdAt: q.created_at,
        }));

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('GET /api/employees/[id]/qualifications error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const supabase = await createClient();

        const { qualification, qualificationStatus, acquiredDate, lastWorkDate, isActive } = body;

        // Check if the qualification already exists for this employee
        const { data: existing, error: checkError } = await supabase
            .from('employee_qualifications')
            .select('qualification')
            .eq('employee_id', id)
            .eq('qualification', qualification)
            .maybeSingle();

        if (checkError) {
            console.error('Check duplicate error:', checkError);
            return NextResponse.json({ error: checkError.message }, { status: 500 });
        }

        if (existing) {
            return NextResponse.json({ error: 'この資格は既に登録されています。' }, { status: 400 });
        }

        // Insert new qualification
        const { data: inserted, error: insertError } = await supabase
            .from('employee_qualifications')
            .insert({
                employee_id: id,
                qualification,
                qualification_status: qualificationStatus,
                acquired_date: acquiredDate || null,
                last_work_date: lastWorkDate || null,
                is_active: isActive,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert qualification error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json(inserted);
    } catch (e: any) {
        console.error('POST /api/employees/[id]/qualifications error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const supabase = await createClient();

        const { qualification, qualificationStatus, acquiredDate, lastWorkDate, isActive } = body;

        // Update qualification using composite filter employee_id and qualification
        const { data: updated, error: updateError } = await supabase
            .from('employee_qualifications')
            .update({
                qualification_status: qualificationStatus,
                acquired_date: acquiredDate || null,
                last_work_date: lastWorkDate || null,
                is_active: isActive,
            })
            .eq('employee_id', id)
            .eq('qualification', qualification)
            .select()
            .single();

        if (updateError) {
            console.error('Update qualification error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json(updated);
    } catch (e: any) {
        console.error('PUT /api/employees/[id]/qualifications error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
