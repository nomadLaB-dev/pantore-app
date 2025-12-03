'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function fetchRequestsAction() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const tenantId = cookieStore.get('active_tenant_id')?.value;

    if (!tenantId) return [];

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

export async function updateRequestStatusAction(requestId: string, status: string, adminNote?: string) {
    console.log('Update request status:', requestId, status, adminNote);
    return;
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
