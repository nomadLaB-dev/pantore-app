'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// List of common public email domains to ignore for tenant domain stamping
const SHARED_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com'
]);

export type CreateTenantState = {
  message?: string;
  error?: string;
};

export async function createTenantAction(prevState: CreateTenantState, formData: FormData): Promise<CreateTenantState> {
  const tenantName = formData.get('tenantName') as string;

  if (!tenantName || tenantName.trim().length === 0) {
    return { error: 'Workspace name is required.' };
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return redirect('/login');
  }

  // Determine if the user's email domain should be associated with the tenant
  let domainToStamp: string | null = null;
  const emailDomain = user.email.split('@')[1];

  if (emailDomain && !SHARED_DOMAINS.has(emailDomain)) {
    domainToStamp = emailDomain;
  }

  // Call the database function to create the tenant and assign ownership
  let { data: newTenantId, error } = await supabase.rpc('create_first_tenant', {
    tenant_name: tenantName.trim(),
    tenant_domain: domainToStamp, // Pass the domain (or null)
  });

  // If there's a unique constraint violation on the domain (code 23505),
  // it means the domain is already taken by another tenant.
  // In this case, we retry creating the tenant WITHOUT the domain stamp.
  if (error && error.code === '23505' && domainToStamp) {
    console.warn(`Domain ${domainToStamp} already taken. Creating tenant without domain.`);
    const retryResult = await supabase.rpc('create_first_tenant', {
      tenant_name: tenantName.trim(),
      tenant_domain: null,
    });
    newTenantId = retryResult.data;
    error = retryResult.error;
  }

  if (error) {
    console.error('Error creating tenant:', error);
    return { error: `Failed to create workspace: ${error.message}` };
  }

  // Set the newly created tenant as the active tenant in a secure cookie.
  // This is a critical step to ensure the middleware recognizes the user's membership.
  if (newTenantId) {
    cookieStore.set('active_tenant_id', newTenantId, {
      path: '/',
      httpOnly: true,
    });
  }

  // Revalidate the root layout to ensure subsequent checks for tenant membership pass
  revalidatePath('/', 'layout');

  // Redirect to the main dashboard, which should now be accessible
  redirect('/dashboard');
}
