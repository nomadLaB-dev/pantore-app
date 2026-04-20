import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapVehicleToFrontend } from './utils';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('GET /api/vehicles: user found:', !!user, 'authError:', authError);

        if (authError || !user) {
            console.warn('GET /api/vehicles: Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: vehicles, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                branch:branches(*),
                lease:vehicle_leases(*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('DB Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // フロントエンドの期待する形式に変換
        const result = vehicles.map(mapVehicleToFrontend);

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('POST /api/vehicles: user found:', !!user, 'authError:', authError);

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 従業員テーブルからtenant_idを取得
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (empError || !employee?.tenant_id) {
            console.error('POST /api/vehicles: Tenant not found for user', user.id, empError);
            return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
        }

        const body = await req.json();
        const { manufacturer, model, licensePlate, licensePlateColor, ownershipType, branchId } = body;

        const { data: vehicle, error: vError } = await supabase
            .from('vehicles')
            .insert({
                tenant_id: employee.tenant_id,
                branch_id: branchId,
                manufacturer,
                model,
                license_plate: licensePlate,
                license_plate_color: licensePlateColor,
                ownership_type: ownershipType
            })
            .select()
            .single();

        if (vError) throw vError;

        // リース情報の保存
        if (ownershipType === 'leased' && body.lease) {
            const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = body.lease;
            const { error: lError } = await supabase.from('vehicle_leases').insert({
                vehicle_id: vehicle.id,
                lease_company: leaseCompany || '未設定',
                contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
                contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
                monthly_fee: monthlyFee ? parseInt(monthlyFee, 10) : 0,
            });
            if (lError) console.error('Failed to insert lease info:', lError);
        }

        // リレーションつきで再取得
        const { data: finalVehicle, error: fetchError } = await supabase
            .from('vehicles')
            .select(`
                *,
                branch:branches(*),
                lease:vehicle_leases(*)
            `)
            .eq('id', vehicle.id)
            .single();

        if (fetchError) throw fetchError;

        // フロントエンド形式に変換
        const result = mapVehicleToFrontend(finalVehicle);

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
