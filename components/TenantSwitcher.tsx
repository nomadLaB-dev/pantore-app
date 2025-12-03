// components/TenantSwitcher.tsx
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { TenantSwitcherUI } from './TenantSwitcherUI';
import { redirect } from 'next/navigation';

type Tenant = {
  id: string;
  name: string;
};

export async function TenantSwitcher() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Should be handled by middleware anyway
  }

  // Fetch all tenants the user is a member of
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select('tenants(id, name)')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching tenants:', error);
    return <div>Error loading workspaces.</div>;
  }

  // The query returns { tenants: { id, name } } objects. Flatten the structure.
  const tenants: Tenant[] = memberships.map((m: any) => m.tenants).filter(Boolean);

  // This case is handled by middleware, but as a fallback, redirect.
  if (tenants.length === 0) {
    return redirect('/portal/create-tenant');
  }

  let activeTenantId = cookieStore.get('active_tenant_id')?.value;

  // If no active tenant is set in cookies, or if the user is somehow not a member 
  // of the tenant stored in the cookie, default to the first one in their list.
  const activeTenantIsValid = tenants.some(t => t.id === activeTenantId);

  if (!activeTenantId || !activeTenantIsValid) {
    activeTenantId = tenants[0].id;
    // We cannot set cookies in a Server Component.
    // We will pass a flag to the client component to trigger a server action to set it.
  }

  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  if (!activeTenant) {
    // This should not happen if logic is correct, but handles potential race conditions.
    return <div>Error: Active workspace not found.</div>
  }

  const shouldSetCookie = !activeTenantIsValid || cookieStore.get('active_tenant_id')?.value !== activeTenantId;

  return <TenantSwitcherUI tenants={tenants} activeTenant={activeTenant} shouldSetCookie={shouldSetCookie} />;
}