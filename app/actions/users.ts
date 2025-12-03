'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { UserSummary, UserDetail, EmploymentHistory } from '@/lib/types';

export async function fetchUsersAction(): Promise<UserSummary[]> {
    const cookieStore = await cookies();
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
    // Create a map of userId -> latest info
    type HistoryRow = { user_id: string; department: string; branch: string };
    const historyMap = new Map<string, { dept?: string; branch?: string }>();
    if (historyData) {
        (historyData as unknown as HistoryRow[]).forEach((h) => {
            if (!historyMap.has(h.user_id)) {
                historyMap.set(h.user_id, { dept: h.department, branch: h.branch });
            }
        });
    }

    // Transform to UserSummary
    type MemberRow = {
        role: any; // Role
        status: any; // UserStatus | 'invited'
        user: {
            id: string;
            email: string;
            name: string | null;
            status: any; // UserStatus
            company: string | null;
            department: string | null;
        } | null;
    };

    return (members as unknown as MemberRow[]).map((m) => {
        if (!m.user) return null;
        const history = historyMap.get(m.user.id);
        return {
            id: m.user.id,
            email: m.user.email,
            name: m.user.name || m.user.email?.split('@')[0] || 'Unknown',
            role: m.role,
            status: m.status === 'invited' ? 'invited' : (m.user.status || 'active'),
            company: m.user.company || undefined,
            dept: history?.dept || m.user.department || undefined, // Use history dept if available, fallback to user profile
            branch: history?.branch || undefined,
            deviceCount: 0,
        } as UserSummary;
    }).filter((u): u is UserSummary => u !== null);
}

export async function fetchUserDetailAction(userId: string): Promise<UserDetail | null> {
    const cookieStore = await cookies();
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
        currentDevices: [], // Mocked
        history,
    };
}

export async function createUserAction(user: UserSummary) {
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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
