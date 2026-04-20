import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapVehicleToFrontend } from '../utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: vehicle, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                branch:branches(*),
                lease:vehicle_leases(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Fetch Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // フロントエンド形式に変換
        const result = mapVehicleToFrontend(vehicle);

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { manufacturer, model, licensePlate, licensePlateColor, ownershipType, branchId } = body;

        const { data, error } = await supabase
            .from('vehicles')
            .update({
                manufacturer,
                model,
                license_plate: licensePlate,
                license_plate_color: licensePlateColor,
                ownership_type: ownershipType,
                branch_id: branchId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // リース情報の更新
        if (ownershipType === 'leased' && body.lease) {
            const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = body.lease;
            const { error: lError } = await supabase.from('vehicle_leases').upsert({
                vehicle_id: id,
                lease_company: leaseCompany || '未設定',
                contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
                contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
                monthly_fee: monthlyFee ? parseInt(monthlyFee, 10) : 0,
            }, { onConflict: 'vehicle_id' });
            if (lError) console.error('Failed to upsert lease info:', lError);
        } else if (ownershipType === 'owned') {
            // 保有形態が自社保有になった場合はリース情報を削除
            await supabase.from('vehicle_leases').delete().eq('vehicle_id', id);
        }

        // リレーションつきで再取得
        const { data: finalVehicle, error: fetchError } = await supabase
            .from('vehicles')
            .select(`
                *,
                branch:branches(*),
                lease:vehicle_leases(*)
            `)
            .eq('id', id)
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
