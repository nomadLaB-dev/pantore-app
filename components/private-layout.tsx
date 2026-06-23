'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store';
import type { SpecimenRole } from '@/types';
import type { ReactNode } from 'react';

type LayoutData = {
  tenantName?: string;
  branchName?: string;
  specimenRole?: SpecimenRole;
  currentUser: { name: string; email: string };
};

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setSpecimenRole = useAppStore((s) => s.setSpecimenRole);
  const [loading, setLoading] = useState(true);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace('/login');
        return;
      }

      let tenantName: string | undefined;
      let branchName: string | undefined;
      let specimenRole: SpecimenRole | undefined;

      const { data: employee } = await supabase
        .from('users')
        .select('tenant_id, branch_id, specimen_role, name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employee) {
        specimenRole = employee.specimen_role as SpecimenRole | undefined;

        if (employee.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', employee.tenant_id)
            .maybeSingle();
          tenantName = tenant?.name;
        }

        if (employee.branch_id) {
          const { data: branch } = await supabase
            .from('branches')
            .select('name')
            .eq('id', employee.branch_id)
            .maybeSingle();
          branchName = branch?.name;
        }
      }

      const currentUser = employee
        ? { name: employee.name, email: employee.email }
        : { name: user.email ?? '', email: user.email ?? '' };

      setSpecimenRole(specimenRole ?? null);
      setLayoutData({ tenantName, branchName, specimenRole, currentUser });
      setLoading(false);
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!layoutData) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        tenantName={layoutData.tenantName}
        branchName={layoutData.branchName}
        specimenRole={layoutData.specimenRole}
        currentUser={layoutData.currentUser}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto p-5 md:p-7">{children}</main>
      </div>
    </div>
  );
}
