'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createInvitationAction(domain?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const tenantId = cookieStore.get('active_tenant_id')?.value;

    if (!tenantId) throw new Error('No active tenant');

    // 1. Verify Permission (Owner/Admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { count } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .in('role', ['owner', 'admin']);

    if (!count) throw new Error('Permission denied');

    // 2. Generate Token
    const token = crypto.randomUUID();

    // 3. Insert Invitation
    const { error } = await supabase
        .from('tenant_invitations')
        .insert({
            tenant_id: tenantId,
            token,
            email_domain: domain || null,
            created_by: user.id
        });

    if (error) {
        console.error('Error creating invitation:', error);
        throw new Error('Failed to create invitation');
    }

    return token;
}

export async function getActiveInvitationAction() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const tenantId = cookieStore.get('active_tenant_id')?.value;

    if (!tenantId) return null;

    const { data: invitation } = await supabase
        .from('tenant_invitations')
        .select('token, email_domain')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return invitation;
}

export async function getInvitationAction(token: string) {
    const supabase = createAdminClient(); // Use admin to bypass RLS if needed, or just public read

    const { data: invitation, error } = await supabase
        .from('tenant_invitations')
        .select(`
            *,
            tenant:tenants (
                name
            )
        `)
        .eq('token', token)
        .eq('is_active', true)
        .single();

    if (error || !invitation) {
        return null;
    }

    return {
        tenantName: invitation.tenant.name,
        domainRestriction: invitation.email_domain,
        tenantId: invitation.tenant_id
    };
}

export async function joinTenantAction(token: string, name: string, email: string, password: string) {
    const supabaseAdmin = createAdminClient();

    // 1. Validate Invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
        .from('tenant_invitations')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single();

    if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation');
    }

    // 2. Check Domain Restriction
    if (invitation.email_domain) {
        const emailDomain = email.split('@')[1];
        if (emailDomain !== invitation.email_domain) {
            throw new Error(`Email domain must be @${invitation.email_domain}`);
        }
    }

    // 3. Create or Get User
    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    // Note: listUsers might be slow if many users, but for now it's fine. 
    // Better: try to getUserByEmail if available, or just try to create and catch error.
    // supabaseAdmin.auth.admin.createUser will fail if email exists.

    let userId: string;

    // Try to create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirm
        user_metadata: { name }
    });

    if (createError) {
        // If error is "User already registered", we proceed to add membership
        // But we need the user ID.
        // Since we can't easily get ID from "create error", we might need to fetch it.
        // BUT, for security, if the user already exists, we should probably require them to LOGIN first, then join?
        // Or, if we are in "Join" flow, maybe we just fail and say "User exists, please login and ask admin to invite"?
        // The requirement was "Shared Invitation Link". Usually this implies new users.
        // If existing user clicks it, they should probably be able to join too.
        // Let's assume for now this is for NEW users as per the "Registration" flow description.
        // If user exists, we throw error "User already exists".
        throw new Error('User already exists. Please login and ask admin to invite you manually.');
    } else {
        userId = newUser.user.id;
    }

    // 4. Create Public User Record
    const { error: publicUserError } = await supabaseAdmin
        .from('users')
        .insert({
            id: userId,
            email,
            name,
            status: 'active'
        });

    if (publicUserError) {
        console.error('Error creating public user:', publicUserError);
        // Continue anyway? Or fail?
    }

    // 5. Create Membership
    const { error: memberError } = await supabaseAdmin
        .from('memberships')
        .insert({
            user_id: userId,
            tenant_id: invitation.tenant_id,
            role: 'member',
            status: 'active'
        });

    if (memberError) {
        console.error('Error creating membership:', memberError);
        throw new Error('Failed to join tenant');
    }

    // 6. Create Initial Employment History
    await supabaseAdmin
        .from('employment_history')
        .insert({
            user_id: userId,
            tenant_id: invitation.tenant_id,
            start_date: new Date().toISOString().split('T')[0],
            company: '未割り当て',
            department: '未割り当て',
            branch: '未割り当て',
            position: '一般'
        });

    return { success: true };
}
