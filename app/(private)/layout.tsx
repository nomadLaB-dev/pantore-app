import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { createClient } from '@/lib/supabase/server';

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('pantore_session');
    if (!session) redirect('/login');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let tenantName: string | undefined;
    let branchName: string | undefined;
    if (user) {
        const { data: employee } = await supabase
            .from('employees')
            .select('tenant_id, branch_id')
            .eq('user_id', user.id)
            .single();

        if (employee) {
            if (employee.tenant_id) {
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('name')
                    .eq('id', employee.tenant_id)
                    .single();
                tenantName = tenant?.name;
            }

            if (employee.branch_id) {
                const { data: branch } = await supabase
                    .from('branches')
                    .select('name')
                    .eq('id', employee.branch_id)
                    .single();
                branchName = branch?.name;
            }
        }
    }

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar tenantName={tenantName} branchName={branchName} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-5 md:p-7">{children}</main>
            </div>
        </div>
    );
}
