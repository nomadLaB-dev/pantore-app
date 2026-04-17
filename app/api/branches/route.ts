import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Supabaseのサーバー用クライアント

export async function GET() {
    try {
        // 1. Supabaseのクライアントを呼び出す
        const supabase = await createClient();

        // 2. branchesテーブルからデータを取得（SQLの SELECT * FROM branches と同じ！）
        const { data: branches, error } = await supabase
            .from('branches')
            .select('*')
            .order('created_at', { ascending: true }); // 作成日時順に並べるおまけ付き✨

        // 3. DB側でエラーが起きたらキャッチして返す
        if (error) {
            console.error('DB取得エラー:', error.message);
            return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
        }

        // 4. 無事にデータが取れたら、フロントエンドにJSONとして返す！
        return NextResponse.json(branches);

    } catch (error) {
        console.error('APIエラー:', error);
        return NextResponse.json({ error: '予期せぬエラーが発生しました' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // 従業員テーブルからtenant_idを取得
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (empError || !employee?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
        }

        const newBranch = {
            id: `branch_${crypto.randomUUID()}`,
            tenant_id: employee.tenant_id,
            name: body.name,
            address: '' // デフォルト値
        };

        const { data, error } = await supabase
            .from('branches')
            .insert(newBranch)
            .select('*')
            .single();

        if (error) {
            console.error('Insert error:', error);
            return NextResponse.json({ error: '支社の作成に失敗しました' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}