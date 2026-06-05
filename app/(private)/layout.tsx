import { redirect } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import type { SpecimenRole } from '@/types';

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    let tenantName: string | undefined;
    let branchName: string | undefined;
    let specimenRole: SpecimenRole | undefined;

    const { data: employee } = await supabase
        .from('employees')
        .select('tenant_id, branch_id, specimen_role, name, email')
        .eq('user_id', user.id)
        .single();

    if (employee) {
        specimenRole = employee.specimen_role as SpecimenRole | undefined;

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

    const currentUser = employee
        ? { name: employee.name, email: employee.email }
        : { name: user.email ?? '', email: user.email ?? '' };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar tenantName={tenantName} branchName={branchName} specimenRole={specimenRole} currentUser={currentUser} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-5 md:p-7">{children}</main>
            </div>
        </div>
    );
}
