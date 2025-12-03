import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import DashboardClientPage from './DashboardClientPage';
import { redirect } from 'next/navigation';
import { type Tenant } from '@/lib/types';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const activeTenantId = cookieStore.get('active_tenant_id')?.value;

  if (!activeTenantId) {
    // This case should be handled by middleware, but as a safeguard,
    // we redirect to the tenant creation page.
    return redirect('/portal/create-tenant');
  }

  const { data: activeTenant, error } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', activeTenantId)
    .single();

  if (error || !activeTenant) {
    // This can happen if the tenant ID in the cookie is stale or invalid.
    // We'll clear the cookie and redirect to the portal, where middleware will take over.
    cookieStore.delete('active_tenant_id');
    return redirect('/portal');
  }

  return <DashboardClientPage activeTenant={activeTenant as Tenant} />;
}
