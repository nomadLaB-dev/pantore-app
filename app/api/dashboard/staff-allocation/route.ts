import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const areaId = url.searchParams.get('areaId');

        // areaId がない場合は、エリア一覧を返す
        if (!areaId) {
            const { data: areas, error: areasError } = await supabase
                .from('areas')
                .select('*')
                .order('display_order', { ascending: true })
                .order('id', { ascending: true });

            if (areasError) {
                console.error('GET /api/dashboard/staff-allocation areas error:', areasError);
                return NextResponse.json({ error: areasError.message }, { status: 500 });
            }
            return NextResponse.json({ areas });
        }

        // areaId に紐づく prefectures を取得
        const { data: prefectures, error: prefError } = await supabase
            .from('prefectures')
            .select('id')
            .eq('area_id', areaId);

        if (prefError) {
            console.error('GET /api/dashboard/staff-allocation prefectures error:', prefError);
            return NextResponse.json({ error: prefError.message }, { status: 500 });
        }

        const prefIds = prefectures.map((p) => p.id);

        if (prefIds.length === 0) {
            return NextResponse.json({ branches: [] });
        }

        // prefIds に紐づく branches を取得
        const { data: branches, error: branchesError } = await supabase
            .from('branches')
            .select('id, name, pref_id')
            .in('pref_id', prefIds)
            .order('name', { ascending: true });

        if (branchesError) {
            console.error('GET /api/dashboard/staff-allocation branches error:', branchesError);
            return NextResponse.json({ error: branchesError.message }, { status: 500 });
        }

        const branchIds = branches.map((b) => b.id);

        let employeeCounts: any[] = [];
        if (branchIds.length > 0) {
            // 日本時間の今日の日付を YYYY-MM-DD 形式で取得
            const jstOffset = 9 * 60 * 60 * 1000;
            const jstDate = new Date(Date.now() + jstOffset);
            const todayStr = jstDate.toISOString().split('T')[0];

            // 今日時点で在籍している社員（退職日が未設定、または今日以降）
            // branch_id が branchIds に含まれる従業員で、人週計算に必要な contracted_hours_per_week_max と proficiency_rate をあわせて取得
            const { data, error: countError } = await supabase
                .from('employees')
                .select('branch_id, contracted_hours_per_week_max, proficiency_rate')
                .in('branch_id', branchIds)
                .or(`leave_date.is.null,leave_date.gte.${todayStr}`);

            if (countError) {
                console.error('GET /api/dashboard/staff-allocation employees count error:', countError);
                return NextResponse.json({ error: countError.message }, { status: 500 });
            }
            employeeCounts = data || [];
        }

        const counts: Record<string, number> = {};
        const sumA: Record<string, number> = {}; // 支社ごとの 【A】= max * rate の合計値

        employeeCounts.forEach((e: any) => {
            if (e.branch_id) {
                // 在籍者数カウント
                counts[e.branch_id] = (counts[e.branch_id] || 0) + 1;

                // 【A】 = contracted_hours_per_week_max * proficiency_rate の計算
                const maxHours = Number(e.contracted_hours_per_week_max || 0);
                const rate = e.proficiency_rate !== null ? Number(e.proficiency_rate) : 1.0;
                const valueA = maxHours * rate;

                sumA[e.branch_id] = (sumA[e.branch_id] || 0) + valueA;
            }
        });

        const branchesWithCount = branches.map((b: any) => {
            const count = counts[b.id] || 0;
            const totalHours = sumA[b.id] || 0; // 【B】
            const manWeeks = totalHours / 40;   // 【C】

            return {
                id: b.id,
                name: b.name,
                prefId: b.pref_id,
                employeeCount: count,
                manWeeks: Number(manWeeks.toFixed(2)) // 小数点以下2位に丸める
            };
        });

        return NextResponse.json({ branches: branchesWithCount });
    } catch (e: any) {
        console.error('GET /api/dashboard/staff-allocation unexpected error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
