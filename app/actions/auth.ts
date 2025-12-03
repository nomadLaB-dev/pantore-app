'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { UserDetail } from '@/lib/types';

export async function switchTenant(tenantId: string) {
    const cookieStore = await cookies();
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

export async function fetchCurrentUserAction(): Promise<UserDetail | null> {
    const cookieStore = await cookies();
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
            currentDevices: [],
            history: [],
        } as UserDetail;
    }

    // Fetch membership if tenantId is present
    let role: any = 'member';
    let status: any = userProfile.status || 'active';
    let tenantName: string | undefined;

    let tenantId = cookieStore.get('active_tenant_id')?.value;

    // If no active tenant cookie, try to find one from memberships
    if (!tenantId) {
        const { data: memberships } = await supabase
            .from('memberships')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1);

        if (memberships && memberships.length > 0) {
            tenantId = memberships[0].tenant_id;
            // Set the cookie for future requests
            if (tenantId) {
                cookieStore.set('active_tenant_id', tenantId, {
                    path: '/',
                    httpOnly: true,
                });
            }
        }
    }

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

    // Fetch current devices (Assets)
    let currentDevices: any[] = [];
    const { data: assets } = await supabase
        .from('assets')
        .select('model, serial, created_at')
        .eq('user_id', user.id)
        .eq('status', 'in_use');

    if (assets) {
        currentDevices = assets.map((asset: any) => ({
            model: asset.model,
            serial: asset.serial,
            assignedAt: asset.created_at,
        }));
    }

    // Fetch employment history
    let history: any[] = [];
    const { data: historyData } = await supabase
        .from('employment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

    if (historyData) {
        history = historyData.map((h: any) => ({
            id: h.id,
            tenantId: h.tenant_id,
            startDate: h.start_date,
            endDate: h.end_date,
            company: h.company,
            dept: h.department, // Map from DB 'department' column
            branch: h.branch,
            position: h.position,
        }));
    }

    return {
        ...userProfile,
        tenantId, // Add tenantId to the return object
        role,
        status,
        tenantName,
        currentDevices,
        history,
    };
}

export async function signOutAction() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    return redirect('/login');
}

export async function updateSelfProfileAction(data: {
    name: string;
    email: string;
    password?: string;
}) {
    const cookieStore = await cookies();
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
