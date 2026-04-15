import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mockVehicles } from '@/lib/mocks/assets';

export async function GET() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: dbBranches } = await supabase.from('branches').select('*');
    const branches = dbBranches || [];

    const result = mockVehicles.map((v) => ({
        ...v,
        branch: branches.find((b: { id: string, name: string }) => b.id === v.branchId) ?? null,
    }));
    return NextResponse.json(result);
}
