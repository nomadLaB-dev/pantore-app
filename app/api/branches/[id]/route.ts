import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    try {
        const body = await req.json();
        const { data, error } = await supabase
            .from('branches')
            .update({ name: body.name, address: body.address })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    try {
        const { error } = await supabase
            .from('branches')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
