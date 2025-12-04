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
    console.log('createUserAction started', user.email);
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const tenantId = cookieStore.get('active_tenant_id')?.value;

        if (!tenantId) throw new Error('No active tenant');

        // 1. Create User in Auth (using Admin Client)
        const supabaseAdmin = createAdminClient();
        let userId: string | undefined;

        console.log('Inviting user...');
        // Try to invite the user. 
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            user.email,
            {
                data: { name: user.name }
            }
        );

        if (authError) {
            console.error('inviteUserByEmail error:', authError);
            // If user already exists, we just want to add them to the tenant
            if (authError.message.includes('already been registered')) {
                console.log('User already registered, fetching existing user ID...');
                const { data: existingUser, error: fetchError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (fetchError || !existingUser) {
                    console.error('Failed to fetch existing user ID:', fetchError);
                    throw new Error(`User already exists but could not be found: ${fetchError?.message}`);
                }

                // If we found the user, we can proceed to add them to the tenant
                // But we need to make sure we have the ID.
                // We can't assign to const, so we need to handle the flow carefully.
                // Let's return early or restructure.

                // REFACTOR: Let's handle the "User Exists" case by just proceeding with the ID.
                // But wait, authUser.user might be null if error.

                // Let's use a variable for userId
                userId = existingUser.id;
            } else {
                console.warn('User creation warning:', authError);
                throw new Error(`User creation failed: ${authError.message}`);
            }
        } else {
            console.log('Invitation sent successfully.');
            userId = authUser?.user?.id;
        }

        if (!userId) {
            console.error('Failed to get userId');
            throw new Error('Failed to create user: No user ID returned');
        }

        console.log('User ID:', userId);

        // 2. Add to Memberships
        console.log('Adding to memberships...');
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
            // If unique violation, maybe they are already a member?
            if (membershipError.code === '23505') { // unique_violation
                console.log('User is already a member of this tenant.');
            } else {
                throw membershipError;
            }
        }

        // 3. Upsert public.users profile to ensure it exists
        // Use admin client to bypass RLS
        console.log('Upserting profile...');
        const { error: profileError } = await supabaseAdmin
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
            // Not critical if membership succeeded, but good to know
        }

        revalidatePath('/dashboard/users');
        return { success: true };

    } catch (error: any) {
        console.error('createUserAction unexpected error:', error);
        throw new Error(error.message || 'An unexpected error occurred');
    }
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
