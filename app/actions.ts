'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserDetail } from '@/lib/types';

export async function switchTenant(tenantId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Verify the user is a member of the tenant they are trying to switch to.
  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId);

  if (count === 0) {
    // If the user is not a member, do not switch. This is a security measure.
    console.error(
      `Security check failed: User ${user.id} attempted to switch to tenant ${tenantId} without membership.`
    );
    // For now, we'll just redirect to a safe default.
    return redirect('/portal');
  }

  // Set the active tenant ID in a secure, httpOnly cookie.
  cookieStore.set('active_tenant_id', tenantId, {
    path: '/',
    httpOnly: true,
  });

  // Redirect to the dashboard to reflect the change.
  redirect('/dashboard');
}

export async function fetchRequestsAction(tenantId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return [];
    }
    return data;
}

// NOTE: This type definition should ideally be in `lib/types.ts`.
// It is placed here because the original component imported it from this file.
export type DashboardKpi = {
  totalAssets: number;
  utilizationRate: number;
  incidents: number;
  mttr: string; // Mean Time To Repair
  costMonth: number;
  costDiff: number; // Difference from previous month
};

export async function fetchDashboardKpiAction(
  year: number,
  month: number,
  tenantId: string
): Promise<DashboardKpi> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // --- Calculations for KPIs ---

  // 1. Total Assets
  const { count: totalAssets, error: totalAssetsError } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // 2. In-Use Assets for Utilization Rate
  const { count: inUseAssets, error: inUseAssetsError } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'in_use');

  // 3. Incidents for the month
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0).toISOString();
  const { count: incidents, error: incidentsError } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('type', 'breakdown')
    .gte('date', startDate)
    .lte('date', endDate);

  if (totalAssetsError || inUseAssetsError || incidentsError) {
    console.error('Error fetching KPI data:', { totalAssetsError, inUseAssetsError, incidentsError });
    // Return a default/error state
    return {
      totalAssets: 0,
      utilizationRate: 0,
      incidents: 0,
      mttr: 'N/A',
      costMonth: 0,
      costDiff: 0,
    };
  }
  
  const utilizationRate =
    totalAssets && totalAssets > 0
      ? Math.round((inUseAssets / totalAssets) * 100)
      : 0;

  // --- Mocked Data ---
  // MTTR, costMonth, and costDiff require more complex calculations or historical data
  // which are not available or defined. Returning mocked values for now.
  const mttr = 'N/A'; // Mocked: MTTR calculation is complex.
  const costMonth = (totalAssets ?? 0) * 1500; // Mocked: e.g., 1500 per asset
  const costDiff = costMonth * 0.1; // Mocked: e.g., 10% increase

  return {
    totalAssets: totalAssets ?? 0,
    utilizationRate,
    incidents: incidents ?? 0,
    mttr,
    costMonth,
    costDiff,
  };
}

export async function fetchCurrentUserAction(): Promise<UserDetail | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !userProfile) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  // For now, we return mock data for complex fields.
  // This matches the UserDetail type while avoiding complex queries.
  return {
    ...userProfile,
    currentDevice: null, // Mocked
    history: [], // Mocked
  };
}

export async function signOutAction() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  return redirect('/login');
}