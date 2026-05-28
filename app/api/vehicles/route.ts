import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // 関連データ（branch, accidents）を含めて車両データを取得
        const { data: dbVehicles, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                branch:branches(*),
                accidents:vehicle_accidents(*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch vehicles in API:', error.message);
            return NextResponse.json({ error: '車両データの取得に失敗しました' }, { status: 500 });
        }

        // フロントエンド用（キャメルケース）に正規化
        const vehicles = (dbVehicles || []).map((vehicle: any) => ({
            id: vehicle.id,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            licensePlate: vehicle.license_plate,
            licensePlateColor: vehicle.license_plate_color,
            ownershipType: vehicle.ownership_type,
            branchId: vehicle.branch_id,
            tireType: vehicle.tire_type,
            branch: vehicle.branch ? { id: vehicle.branch.id, name: vehicle.branch.name } : null,
            accidents: (vehicle.accidents || []).map((acc: any) => ({
                id: acc.id,
                accidentDate: acc.accident_date,
                description: acc.description,
                severity: acc.severity,
            })),
            createdAt: vehicle.created_at,
            updatedAt: vehicle.updated_at,
        }));

        return NextResponse.json(vehicles);
    } catch (error) {
        console.error('API vehicles handler error:', error);
        return NextResponse.json({ error: '予期せぬエラーが発生しました' }, { status: 500 });
    }
}
