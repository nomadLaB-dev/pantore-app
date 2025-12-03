'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Asset } from '@/lib/types';

export async function fetchAssetsAction(): Promise<Asset[]> {
    const cookieStore = await cookies();
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
    type AssetRow = {
        id: string;
        tenant_id: string;
        management_id: string;
        serial: string;
        model: string;
        user_id: string | null;
        user: { name: string | null; email: string | null } | null;
        status: any; // AssetStatus
        ownership: any; // OwnershipType
        purchase_date: string;
        contract_end_date: string | null;
        return_date: string | null;
        purchase_cost: number | null;
        monthly_cost: number | null;
        months: number | null;
        depreciation_months: number | null;
        note: string | null;
        accessories: string[];
    };

    return (data as unknown as AssetRow[]).map((item) => ({
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
        contractEndDate: item.contract_end_date || undefined,
        returnDate: item.return_date || undefined,
        purchaseCost: item.purchase_cost || undefined,
        monthlyCost: item.monthly_cost || undefined,
        months: item.months || undefined,
        depreciationMonths: item.depreciation_months || undefined,
        note: item.note || undefined,
        accessories: item.accessories,
    }));
}

export async function createAssetAction(asset: Asset) {
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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
    const cookieStore = await cookies();
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

export async function fetchAssetStatusStatsAction(tenantId: string) {
    const cookieStore = await cookies();
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

export async function assignAssetToUserAction(assetId: string, userId: string) {
    const cookieStore = await cookies();
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
