'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { OrganizationSettings, MasterData } from '@/lib/types';

export async function fetchSettingsAction(): Promise<OrganizationSettings | null> {
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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

export async function fetchMasterDataAction(): Promise<MasterData> {
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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
