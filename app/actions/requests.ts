'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { fetchCurrentUserAction } from '@/app/actions/auth';

export async function fetchRequestsAction() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const tenantId = cookieStore.get('active_tenant_id')?.value;

    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('requests')
        .select(`
            *,
            user:users (
                id,
                name
            )
        `)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return [];
    }

    // Fetch latest employment history for these users to get department
    const userIds = Array.from(new Set(data.map((req: any) => req.user?.id).filter(Boolean)));

    let historyMap = new Map<string, string>();
    if (userIds.length > 0) {
        const { data: historyData } = await supabase
            .from('employment_history')
            .select('user_id, department')
            .in('user_id', userIds)
            .order('start_date', { ascending: false });

        if (historyData) {
            // Create map of user_id -> department (first one is latest due to order)
            historyData.forEach((h: any) => {
                if (!historyMap.has(h.user_id)) {
                    historyMap.set(h.user_id, h.department);
                }
            });
        }
    }

    // Map to Request type
    return data.map((req: any) => ({
        ...req,
        userId: req.user_id, // Map snake_case to camelCase
        userName: req.user?.name || 'Unknown',
        userDept: historyMap.get(req.user?.id) || 'Unknown',
    }));
}

export async function updateRequestStatusAction(requestId: string, status: string, adminNote?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const updateData: any = { status };
    if (adminNote !== undefined) {
        updateData.admin_note = adminNote; // Map to snake_case column
    }

    const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', requestId);

    if (error) {
        console.error('Error updating request status:', error);
        throw error;
    }

    revalidatePath('/dashboard/requests');
}

import type { CreateRequestInput } from '@/lib/types';

export async function createRequestAction(request: CreateRequestInput) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const tenantId = cookieStore.get('active_tenant_id')?.value;

    if (!tenantId) throw new Error('No active tenant');

    const { error } = await supabase.from('requests').insert({
        tenant_id: tenantId,
        user_id: request.userId,
        type: request.type,
        date: request.date,
        detail: request.detail,
        note: request.note,
        status: 'pending'
    });

    if (error) {
        console.error('Error creating request:', error);
        throw error;
    }

    revalidatePath('/portal');
    revalidatePath('/dashboard/requests');
}

export async function fetchMyRequestsAction() {
    const user = await fetchCurrentUserAction();
    if (!user || !user.tenantId) return [];

    const supabase = createAdminClient();

    // We use createAdminClient to bypass RLS, but we strictly filter by user.id
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', user.tenantId) // Filter by tenant
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching my requests:', error);
        return [];
    }

    return data.map((req: any) => ({
        ...req,
        userId: req.user_id, // Map snake_case to camelCase
        userName: user.name,
        userDept: user.dept || 'Unknown',
    }));
}
