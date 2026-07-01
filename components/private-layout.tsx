'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Menu, Layers } from 'lucide-react';
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
  const setBranchId = useAppStore((s) => s.setBranchId);
  const setUserName = useAppStore((s) => s.setUserName);
  const [loading, setLoading] = useState(true);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      setBranchId(employee?.branch_id ?? null);
      setUserName(employee?.name ?? null);
      setLayoutData({ tenantName, branchName, specimenRole, currentUser });
      setLoading(false);

      // ドライバーは集配送予定とタイムカードのみアクセス可能
      if (specimenRole === 'driver') {
        const p = window.location.pathname;
        if (!p.startsWith('/schedules') && !p.startsWith('/timecard')) {
          router.replace('/schedules');
          return;
        }
      }
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
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* モバイル用ヘッダー */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-amber-950 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-amber-950" />
            </div>
            <span className="font-bold text-sm text-white">SpecimenChimera</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-amber-100/70 hover:text-amber-100 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="メニューを開く"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
