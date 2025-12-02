'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { UserDetail, OrganizationSettings, MasterData, UserSummary, Asset, EmploymentHistory } from '@/lib/types';

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
      ? Math.round(((inUseAssets ?? 0) / totalAssets) * 100)
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('fetchCurrentUserAction: Auth error or no user', authError);
    return null;
  }

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('fetchCurrentUserAction: Error fetching user profile', error);
    // If the user exists in auth but not in public.users, we might want to return a partial object or null.
    // For now, returning null to indicate failure to load full profile.
    return null;
  }

  if (!userProfile) {
    console.error('fetchCurrentUserAction: User profile not found for id', user.id);
    // Return fallback user data so the UI doesn't get stuck on loading
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Guest',
      role: 'member',
      status: 'active',
      company: '',
      dept: '',
      deviceCount: 0,
      currentDevice: null,
      history: [],
    } as UserDetail;
  }

  // Fetch membership if tenantId is present
  let role: any = 'member';
  let status: any = userProfile.status || 'active';
  let tenantName: string | undefined;

  const tenantId = cookieStore.get('active_tenant_id')?.value;
  if (tenantId) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    if (membership) {
      role = membership.role;

      // Auto-activate if invited
      if (membership.status === 'invited') {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin
          .from('memberships')
          .update({ status: 'active' })
          .eq('user_id', user.id)
          .eq('tenant_id', tenantId);

        // Status remains 'active' (or whatever userProfile has), effectively activating them in UI too
      } else if (membership.status) {
        // If membership has a status (e.g. active), we could use it, 
        // but usually we trust userProfile.status for 'active'/'inactive' (employment).
        // However, if we want to show 'invited' in the UI for current user (unlikely as they are logged in),
        // we would handle it here. But since we just activated them, they are active.
      }
    }

    // Fetch tenant name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    if (tenant) {
      tenantName = tenant.name;
    }
  }

  return {
    ...userProfile,
    role,
    status,
    tenantName,
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

// --- Organization Settings Actions ---

export async function fetchSettingsAction(): Promise<OrganizationSettings | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) return null;

  // 1. Try to fetch existing settings
  const { data: settings, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (settings) {
    return {
      ...settings,
      allowedOwnerships: settings.allowed_ownerships || [], // Map snake_case to camelCase if needed, or ensure DB matches
      contactLabel: settings.contact_label,
      contactValue: settings.contact_value,
    } as any; // Type assertion might be needed depending on DB schema vs Type definition
  }

  // 2. If no settings, fetch tenant name to populate default
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single();

  if (tenant) {
    return {
      name: tenant.name,
      allowedOwnerships: ['owned', 'rental', 'lease', 'byod'], // Default to all enabled
      contactLabel: '',
      contactValue: ''
    };
  }

  return null;
}

export async function updateSettingsAction(settings: OrganizationSettings) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  // 1. Upsert settings
  const { error: settingsError } = await supabase
    .from('organization_settings')
    .upsert({
      tenant_id: tenantId,
      name: settings.name,
      allowed_ownerships: settings.allowedOwnerships,
      contact_label: settings.contactLabel,
      contact_value: settings.contactValue,
    }, { onConflict: 'tenant_id' });

  if (settingsError) throw settingsError;

  // 2. Sync tenant name
  const { error: tenantError } = await supabase
    .from('tenants')
    .update({ name: settings.name })
    .eq('id', tenantId);

  if (tenantError) throw tenantError;

  revalidatePath('/dashboard');
}

// --- Master Data Actions (Mocked for now as per schema) ---

export async function fetchMasterDataAction(): Promise<MasterData> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) {
    return { companies: [], departments: [], branches: [] };
  }

  const [companiesResult, departmentsResult, branchesResult] = await Promise.all([
    supabase.from('companies').select('name').eq('tenant_id', tenantId),
    supabase.from('departments').select('name').eq('tenant_id', tenantId),
    supabase.from('branches').select('name').eq('tenant_id', tenantId),
  ]);

  return {
    companies: companiesResult.data?.map(c => c.name) || [],
    departments: departmentsResult.data?.map(d => d.name) || [],
    branches: branchesResult.data?.map(b => b.name) || [],
  };
}

export async function updateMasterDataAction(data: MasterData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  // Helper to sync list
  const syncList = async (table: string, newNames: string[]) => {
    // 1. Delete existing (simplest approach for just strings)
    // Note: This changes IDs. If IDs are used as FKs, this is bad.
    // However, users table uses text for company/dept, so it's likely fine.
    // A safer approach would be to find diffs, but for now this ensures exact match.
    // Let's try to be slightly smarter: delete ones not in list, insert ones not in DB.

    const { data: existing } = await supabase
      .from(table)
      .select('name')
      .eq('tenant_id', tenantId);

    const existingNames = existing?.map(e => e.name) || [];

    const toDelete = existingNames.filter(n => !newNames.includes(n));
    const toInsert = newNames.filter(n => !existingNames.includes(n));

    if (toDelete.length > 0) {
      await supabase
        .from(table)
        .delete()
        .eq('tenant_id', tenantId)
        .in('name', toDelete);
    }

    if (toInsert.length > 0) {
      await supabase
        .from(table)
        .insert(toInsert.map(name => ({ tenant_id: tenantId, name })));
    }
  };

  await Promise.all([
    syncList('companies', data.companies),
    syncList('departments', data.departments),
    syncList('branches', data.branches),
  ]);

  revalidatePath('/dashboard/settings');
}

// --- User Management Actions ---

export async function fetchUsersAction(): Promise<UserSummary[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) return [];

  // Fetch users who are members of the active tenant
  const { data: members, error } = await supabase
    .from('memberships')
    .select(`
      role,
      status,
      user:users (
        id,
        email,
        name,
        status,
        company,
        department
      )
    `)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  // Fetch latest employment history for all fetched users to get current department and branch
  const userIds = members.map((m: any) => m.user?.id).filter(Boolean);
  const { data: historyData } = await supabase
    .from('employment_history')
    .select('user_id, department, branch')
    .in('user_id', userIds)
    .order('start_date', { ascending: false });

  // Create a map of userId -> latest info
  const historyMap = new Map<string, { dept?: string; branch?: string }>();
  if (historyData) {
    historyData.forEach((h: any) => {
      if (!historyMap.has(h.user_id)) {
        historyMap.set(h.user_id, { dept: h.department, branch: h.branch });
      }
    });
  }

  // Transform to UserSummary
  return members.map((m: any) => {
    if (!m.user) return null;
    const history = historyMap.get(m.user.id);
    return {
      id: m.user.id,
      email: m.user.email,
      name: m.user.name || m.user.email?.split('@')[0] || 'Unknown',
      role: m.role,
      status: m.status === 'invited' ? 'invited' : (m.user.status || 'active'),
      company: m.user.company,
      dept: history?.dept || m.user.department, // Use history dept if available, fallback to user profile
      branch: history?.branch,
      deviceCount: 0,
    };
  }).filter((u: any) => u !== null) as UserSummary[];
}

export async function fetchUserDetailAction(userId: string): Promise<UserDetail | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch user profile
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('Error fetching user detail:', error);
    return null;
  }

  // Fetch membership role
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', userId)
    .single();

  // Fetch employment history
  const { data: historyData } = await supabase
    .from('employment_history')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  const history = historyData?.map((h: any) => ({
    id: h.id,
    startDate: h.start_date,
    endDate: h.end_date,
    company: h.company,
    dept: h.department,
    branch: h.branch,
    position: h.position,
  })) || [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: membership?.role || 'user',
    status: user.status,
    company: user.company,
    dept: user.department, // Map department to dept
    deviceCount: 0,
    currentDevice: null, // Mocked
    history,
  };
}

export async function createUserAction(user: UserSummary) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  // 1. Create User in Auth (using Admin Client)
  // We need admin privileges to create a user without signing them in immediately
  const supabaseAdmin = createAdminClient();

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  // Note: listUsers is paginated, but for now assuming small scale or we should use getUserByEmail if available in admin api
  // Actually, createUser with existing email returns error, which we can handle.

  // Try to create the user. 
  // In a real app, we might want to send an invitation.
  // Here, we'll create them with a temporary password or just invite them.
  // Let's use inviteUserByEmail if possible, or createUser.

  // For this environment, let's try creating them directly with auto-confirm.
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    user_metadata: { name: user.name },
    password: 'tempPassword123!', // Should be changed by user later
  });

  let userId = authUser?.user?.id;

  if (authError) {
    // If user already exists, we just want to add them to the tenant
    // We need to find their ID.
    if (authError.message.includes('already been registered')) {
      console.log('User already registered, fetching existing user ID...');
      // Fetch user ID from public.users using admin client (bypassing RLS)
      // Since we are in a server action, we can use the admin client to query public.users
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (fetchError || !existingUser) {
        console.error('Failed to fetch existing user ID:', fetchError);
        throw new Error(`User already exists but could not be found: ${fetchError?.message}`);
      }

      userId = existingUser.id;
    } else {
      console.warn('User creation warning:', authError);
      throw new Error(`User creation failed: ${authError.message}`);
    }
  }

  if (!userId) throw new Error('Failed to create user');

  // 2. Add to Memberships
  // Use admin client to bypass RLS since there is no INSERT policy for memberships
  const { error: membershipError } = await supabaseAdmin
    .from('memberships')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      role: user.role,
      status: 'invited',
    });

  if (membershipError) {
    console.error('Error adding membership:', membershipError);
    throw membershipError;
  }

  // 3. Upsert public.users profile to ensure it exists
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: user.email,
      name: user.name,
      company: user.company,
      department: user.dept, // Map dept to department
      status: user.status, // This is employment status, usually 'active'
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Error updating profile:', profileError);
    // Not critical if membership succeeded
  }

  revalidatePath('/dashboard/users');
}

export async function updateUserAction(user: UserSummary) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  // 1. Update public.users
  const { error: userError } = await supabase
    .from('users')
    .update({
      name: user.name,
      company: user.company,
      department: user.dept, // Map dept to department
      status: user.status,
    })
    .eq('id', user.id);

  if (userError) throw userError;

  // 2. Update membership role
  // Use admin client to bypass RLS since there is no UPDATE policy for memberships
  const supabaseAdmin = createAdminClient();
  const { error: memberError } = await supabaseAdmin
    .from('memberships')
    .update({ role: user.role })
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId);

  if (memberError) throw memberError;

  revalidatePath('/dashboard/users');
}

export async function createEmploymentHistoryAction(history: EmploymentHistory & { userId: string }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  const { error } = await supabase
    .from('employment_history')
    .insert({
      tenant_id: tenantId,
      user_id: history.userId,
      start_date: history.startDate,
      end_date: history.endDate || null,
      company: history.company,
      department: history.dept,
      branch: history.branch,
      position: history.position,
    });

  revalidatePath('/dashboard/users');
}

export async function updateEmploymentHistoryAction(history: EmploymentHistory) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  const { error } = await supabase
    .from('employment_history')
    .update({
      start_date: history.startDate,
      end_date: history.endDate || null,
      company: history.company,
      department: history.dept,
      branch: history.branch,
      position: history.position,
    })
    .eq('id', history.id)
    .eq('tenant_id', tenantId); // Security check

  if (error) {
    console.error('Error updating employment history:', error);
    throw error;
  }

  revalidatePath('/dashboard/users');
  revalidatePath('/portal');
}

export async function deleteEmploymentHistoryAction(historyId: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  const { error } = await supabase
    .from('employment_history')
    .delete()
    .eq('id', historyId)
    .eq('tenant_id', tenantId); // Security check

  if (error) {
    console.error('Error deleting employment history:', error);
    throw error;
  }

  revalidatePath('/dashboard/users');
  revalidatePath('/portal');
}

export async function updateSelfProfileAction(data: {
  name: string;
  email: string;
  password?: string;
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  // 1. Update Password (if provided)
  if (data.password && data.password.trim().length > 0) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: data.password
    });
    if (passwordError) throw new Error(`Password update failed: ${passwordError.message}`);
  }

  // 2. Update Email (if changed)
  // Note: This usually triggers a confirmation email flow.
  // For now, we will attempt to update it. If it requires confirmation, Supabase handles it.
  if (data.email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: data.email
    });
    if (emailError) throw new Error(`Email update failed: ${emailError.message}`);
  }

  // 3. Update Public Profile (Name, Email)
  const { error: profileError } = await supabase
    .from('users')
    .update({
      name: data.name,
      email: data.email, // Keep public profile in sync
    })
    .eq('id', user.id);

  if (profileError) throw profileError;

  revalidatePath('/portal');
  revalidatePath('/dashboard/users');
}

export async function fetchAssetStatusStatsAction(tenantId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('assets')
    .select('status')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching asset stats:', error);
    return { in_use: 0, available: 0, repair: 0, maintenance: 0, disposed: 0 };
  }

  const stats = {
    in_use: 0,
    available: 0,
    repair: 0,
    maintenance: 0,
    disposed: 0
  };

  data.forEach((asset: any) => {
    const status = asset.status as keyof typeof stats;
    if (stats[status] !== undefined) {
      stats[status]++;
    }
  });

  return stats;
}

export async function fetchAssetsAction(): Promise<Asset[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      user:users (
        name,
        email
      )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assets:', error);
    return [];
  }

  // Map snake_case DB fields to camelCase TS types if necessary
  return data.map((item: any) => ({
    id: item.id,
    tenantId: item.tenant_id,
    managementId: item.management_id,
    serial: item.serial,
    model: item.model,
    userId: item.user_id,
    userName: item.user ? (item.user.name || item.user.email) : '-',
    status: item.status,
    ownership: item.ownership,
    purchaseDate: item.purchase_date,
    contractEndDate: item.contract_end_date,
    returnDate: item.return_date,
    purchaseCost: item.purchase_cost,
    monthlyCost: item.monthly_cost,
    months: item.months,
    depreciationMonths: item.depreciation_months,
    note: item.note,
    accessories: item.accessories,
  }));
}

// --- Asset Management Actions ---

export async function createAssetAction(asset: Asset) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) throw new Error('No active tenant');

  const { error } = await supabase.from('assets').insert({
    tenant_id: tenantId,
    management_id: asset.managementId,
    serial: asset.serial,
    model: asset.model,
    user_id: asset.userId || null,
    status: asset.status,
    ownership: asset.ownership,
    purchase_date: asset.purchaseDate,
    contract_end_date: asset.contractEndDate || null,
    return_date: asset.returnDate || null,
    purchase_cost: asset.purchaseCost || null,
    monthly_cost: asset.monthlyCost || null,
    months: asset.months || null,
    depreciation_months: asset.depreciationMonths || null,
    note: asset.note || null,
    accessories: asset.accessories || [],
  });

  if (error) {
    console.error('Error creating asset:', error);
    throw error;
  }

  revalidatePath('/dashboard/assets');
}

export async function updateAssetAction(asset: Asset) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('assets')
    .update({
      management_id: asset.managementId,
      serial: asset.serial,
      model: asset.model,
      user_id: asset.userId || null,
      status: asset.status,
      ownership: asset.ownership,
      purchase_date: asset.purchaseDate,
      contract_end_date: asset.contractEndDate || null,
      return_date: asset.returnDate || null,
      purchase_cost: asset.purchaseCost || null,
      monthly_cost: asset.monthlyCost || null,
      months: asset.months || null,
      depreciation_months: asset.depreciationMonths || null,
      note: asset.note || null,
      accessories: asset.accessories || [],
    })
    .eq('id', asset.id);

  if (error) {
    console.error('Error updating asset:', error);
    throw error;
  }

  revalidatePath('/dashboard/assets');
}

export async function deleteAssetAction(assetId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }

  revalidatePath('/dashboard/assets');
}

// --- Report Actions ---

// --- Report Types ---

export type CostReportRow = {
  company: string; // This effectively acts as Branch
  dept: string;
  assetCount: number;
  cost: number;
};

export type IncidentReportData = {
  count: number;
  requests: {
    id: string;
    date: string;
    userName: string;
    userDept: string;
    detail: string;
    status: string;
  }[];
};

export type AssetDetailRow = {
  managementId: string;
  model: string;
  serial: string;
  ownership: string;
  status: string;
  userName: string;
  company: string;
  dept: string;
  monthlyCost: number;
  purchaseDate: string;
};

export async function fetchReportsAction(year: number, month: number): Promise<{
  costReport: CostReportRow[];
  incidentReport: IncidentReportData;
  assetDetailList: AssetDetailRow[];
}> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const tenantId = cookieStore.get('active_tenant_id')?.value;

  if (!tenantId) {
    return {
      costReport: [],
      incidentReport: { count: 0, requests: [] },
      assetDetailList: []
    };
  }

  // 1. Fetch Assets with User info
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select(`
      *,
      user:users (
        name,
        company,
        department
      )
    `)
    .eq('tenant_id', tenantId);

  if (assetsError) {
    console.error('Error fetching assets for report:', assetsError);
    return {
      costReport: [],
      incidentReport: { count: 0, requests: [] },
      assetDetailList: []
    };
  }

  // 2. Calculate Cost Report & Asset Detail List
  // We need to support switching views, so we'll return raw data or a structure that supports it.
  // Actually, the requirement says "Switch view by Branch or Dept".
  // The current CostReportRow has both company (branch) and dept.
  // The frontend aggregates this? No, the frontend currently receives pre-aggregated data?
  // The current implementation aggregates by `company_dept`.
  // To support switching, we should probably return the granular data (per asset or per smallest unit)
  // OR return two separate reports?
  // Let's look at the frontend. It receives `costReport` which is an array of rows.
  // If we return rows unique by (company, dept), the frontend can aggregate by company OR dept.
  // So we just need to ensure we have one row per (company, dept) combination.
  // AND we need to ensure the cost calculation includes owned assets.

  const costMap = new Map<string, CostReportRow>();
  const assetDetails: AssetDetailRow[] = [];

  // 1.5 Fetch Employment History for these users to get accurate Company/Dept
  const userIds = Array.from(new Set(assets.map((a: any) => a.user_id).filter(Boolean)));
  const { data: historyData } = await supabase
    .from('employment_history')
    .select('user_id, company, department, branch')
    .in('user_id', userIds)
    .order('start_date', { ascending: false });

  const historyMap = new Map<string, { company?: string; dept?: string; branch?: string }>();
  if (historyData) {
    historyData.forEach((h: any) => {
      if (!historyMap.has(h.user_id)) {
        historyMap.set(h.user_id, { company: h.company, dept: h.department, branch: h.branch });
      }
    });
  }

  assets.forEach((asset: any) => {
    // Determine Branch (Company) and Dept
    // Logic: Use employment history if available, fallback to user profile, then '未割り当て'
    const history = asset.user_id ? historyMap.get(asset.user_id) : null;

    // Note: The requirement says "Branch" view. In our schema, we have Company and Branch.
    // The previous implementation treated 'company' as Branch.
    // Let's check `fetchUsersAction`:
    // company: m.user.company,
    // dept: history?.dept || m.user.department,
    // branch: history?.branch,

    // In `fetchReportsAction` previously:
    // company = asset.user?.company
    // dept = asset.user?.department

    // If the user wants "Branch" view, we should probably use `branch` from history if available.
    // If `branch` is empty, maybe fallback to `company`?
    // Let's look at `CostReportRow` definition: `company: string`.
    // And the UI says "拠点(会社)".
    // So we should prioritize `branch` -> `company`.

    const company = history?.branch || history?.company || asset.user?.company || '未割り当て';
    const dept = history?.dept || asset.user?.department || '未割り当て';
    const key = `${company}_${dept}`;

    // Calculate Monthly Cost using the new logic
    let monthlyCost = 0;
    if (asset.ownership === 'owned') {
      const total = asset.purchase_cost || 0;
      const months = asset.depreciation_months || 0;
      if (months > 0) {
        monthlyCost = Math.round(total / months);
      }
    } else if (asset.ownership === 'rental' || asset.ownership === 'lease') {
      monthlyCost = asset.monthly_cost || 0;
      // Check if returned before this month
      if (asset.return_date) {
        const returnDate = new Date(asset.return_date);
        // Reset time to midnight to ensure date-only comparison
        returnDate.setHours(0, 0, 0, 0);

        const reportStart = new Date(year, month - 1, 1);
        reportStart.setHours(0, 0, 0, 0);

        // If returnDate is strictly before reportStart, cost is 0.
        // Example: Return Nov 30. Report Dec 1. Nov 30 < Dec 1. Cost 0.
        // Example: Return Dec 1. Report Dec 1. Dec 1 < Dec 1 is False. Cost applies (maybe pro-rated? but logic says full monthly cost).
        if (returnDate.getTime() < reportStart.getTime()) {
          monthlyCost = 0;
        }
      }
    }

    // Update Cost Report (Aggregate by Company + Dept)
    if (!costMap.has(key)) {
      costMap.set(key, { company, dept, assetCount: 0, cost: 0 });
    }
    const entry = costMap.get(key)!;
    entry.assetCount += 1;
    entry.cost += monthlyCost;

    // Add to Asset Detail List
    assetDetails.push({
      managementId: asset.management_id || '-',
      model: asset.model || '-',
      serial: asset.serial || '-',
      ownership: asset.ownership || '-',
      status: asset.status || '-',
      userName: asset.user?.name || '-',
      company,
      dept,
      monthlyCost,
      purchaseDate: asset.purchase_date || '-',
    });
  });

  const costReport = Array.from(costMap.values());

  // 3. Fetch Incidents (Requests)
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0).toISOString();

  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select(`
      *,
      user:users (
        name,
        department
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('type', 'breakdown')
    .gte('date', startDate)
    .lte('date', endDate);

  if (requestsError) {
    console.error('Error fetching incidents:', requestsError);
    return {
      costReport,
      incidentReport: { count: 0, requests: [] },
      assetDetailList: assetDetails
    };
  }

  const incidentReport: IncidentReportData = {
    count: requests.length,
    requests: requests.map((r: any) => ({
      id: r.id,
      date: r.date,
      userName: r.user?.name || 'Unknown',
      userDept: r.user?.department || 'Unknown',
      detail: r.detail || '',
      status: r.status
    }))
  };

  return {
    costReport,
    incidentReport,
    assetDetailList: assetDetails
  };
}

// --- Request Actions ---

export async function updateRequestStatusAction(requestId: string, status: string, adminNote?: string) {
  console.log('Update request status:', requestId, status, adminNote);
  return;
}



export async function assignAssetToUserAction(assetId: string, userId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('assets')
    .update({
      user_id: userId,
      status: 'in_use'
    })
    .eq('id', assetId);

  if (error) {
    console.error('Error assigning asset:', error);
    throw error;
  }

  revalidatePath('/dashboard/assets');
  revalidatePath('/dashboard/users');
}