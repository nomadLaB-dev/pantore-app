import { createClient } from '@/lib/supabase/server';
import TenantForm from './_components/TenantForm';
import BranchManagement from './_components/BranchManagement';
import AssetExport from './_components/AssetExport';

export default async function SettingsPage() {
    // サーバーサイドでのデータ初期フェッチ (RSC)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let tenant = null;
    let branches: any[] = [];

    if (user) {
        // 現在のユーザーからテナントIDを特定
        const { data: employee, error: empError } = await supabase.from('employees').select('tenant_id').eq('user_id', user.id).single();
        console.log("RSC DEBUG -> user_id:", user.id, "employee:", employee, "empError:", empError);

        if (employee?.tenant_id) {
            // テナント情報を取得
            const { data: tenantData } = await supabase.from('tenants').select('*').eq('id', employee.tenant_id).single();
            tenant = tenantData;

            // 支社情報を一覧取得
            const { data: branchData, error: brError } = await supabase.from('branches').select('*').order('created_at', { ascending: true });
            console.log("RSC DEBUG -> branchData length:", branchData?.length, "brError:", brError);
            branches = branchData || [];
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">設定</h1>
                <p className="text-muted-foreground text-sm">テナント情報・エクスポートなど管理者設定を行います。</p>
            </div>

            <TenantForm initialData={tenant} />
            <BranchManagement initialBranches={branches} />
            <AssetExport />
        </div>
    );
}
