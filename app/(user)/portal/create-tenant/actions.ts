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

export async function createTenantAction(formData: FormData) {
  const tenantName = formData.get('tenantName') as string;

  if (!tenantName || tenantName.trim().length === 0) {
    console.error('Workspace name is required.');
    return;
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
  const { data, error } = await supabase.rpc('create_first_tenant', {
    tenant_name: tenantName.trim(),
    tenant_domain: domainToStamp, // Pass the domain (or null)
  });

  if (error) {
    console.error('Error creating tenant:', error);
    // TODO: Handle potential unique constraint violation on domain
    return;
  }

  // Revalidate the root layout to ensure subsequent checks for tenant membership pass
  revalidatePath('/', 'layout');
  
  // Redirect to the main dashboard, which should now be accessible
  redirect('/dashboard');
}
