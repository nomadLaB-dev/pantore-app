'use server';

import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// --- Login Action ---
export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !user) {
        return { error: 'Invalid login credentials. Please try again.' };
    }

    // Fetch memberships to determine default tenant
    const { data: memberships } = await supabase
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id);

    if (memberships && memberships.length > 0) {
        // Set the first tenant as active
        // In a real app, might want to check for 'last_active' or similar, but this is a good start.
        cookieStore.set('active_tenant_id', memberships[0].tenant_id, {
            path: '/',
            httpOnly: true,
            // secure: true, // dependent on env
        });
    }

    return redirect('/portal');
}


// --- Multi-Step Signup Actions ---

const SHARED_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com'
]);

export async function checkDomainForTenant(email: string): Promise<{ tenantId: string; tenantName: string } | null> {
    if (!email) return null;
    const domain = email.split('@')[1];
    if (!domain || SHARED_DOMAINS.has(domain)) {
        return null;
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('domain', domain)
        .single();

    if (tenant) {
        return { tenantId: tenant.id, tenantName: tenant.name };
    }
    return null;
}

export async function standardSignup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
            },
        },
    });

    if (error) {
        return { error: 'Could not complete signup. Please try again.' };
    }

    if (user) {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        // Auto-login
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            console.error('Auto-login failed:', loginError);
            return { error: 'Account created, but auto-login failed. Please log in manually.' };
        }
    }

    return redirect('/portal/create-tenant');
}

export async function signupAndRequestToJoin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const tenantId = formData.get('tenantId') as string;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
            },
        },
    });

    if (signupError) {
        return { error: 'Could not create user account. The email may be taken.' };
    }

    if (!user) {
        return { error: 'User was not created. Please try again.' };
    }

    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    const { error: requestError } = await supabase
        .from('join_requests')
        .insert({
            email: user.email!,
            tenant_id: tenantId,
            status: 'pending',
        });

    if (requestError) {
        return { error: 'Your account was created, but the request to join failed. Please contact support.' };
    }

    return { success: true };
}

export async function updatePasswordAction(password: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        console.error('Error updating password:', error);
        throw new Error('Failed to update password');
    }

    return { success: true };
}