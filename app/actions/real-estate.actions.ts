'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createRealEstate(data: any) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
    if (empError || !employee) throw new Error('Employee not found');

    const {
        name,
        address,
        ownershipType,
        usageType,
        floorArea,
        contract
    } = data;

    // 1. Insert real estate
    const { data: estate, error: reError } = await supabase
        .from('real_estates')
        .insert({
            tenant_id: employee.tenant_id,
            name,
            address,
            ownership_type: ownershipType
        })
        .select()
        .single();

    if (reError) throw reError;

    // 2. Insert usage info
    if (usageType) {
        const { error: uError } = await supabase.from('real_estate_usages').insert({
            real_estate_id: estate.id,
            usage_type: usageType,
            floor_area: floorArea ? parseFloat(floorArea) : null
        });
        if (uError) console.error('Failed to insert usage info:', uError);
    }

    // 3. Insert contract info if leased
    if (ownershipType === 'leased' && contract) {
        const { landlord, monthlyRent, startDate, endDate, alertDaysBefore } = contract;
        const { error: cError } = await supabase.from('real_estate_contracts').insert({
            real_estate_id: estate.id,
            landlord: landlord || '未設定',
            monthly_rent: monthlyRent ? parseInt(monthlyRent, 10) : 0,
            start_date: startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || new Date().toISOString().split('T')[0],
            alert_days_before: alertDaysBefore ? parseInt(alertDaysBefore, 10) : 90
        });
        if (cError) console.error('Failed to insert contract info:', cError);
    }

    revalidatePath('/real-estates');
    return estate;
}

export async function updateRealEstate(id: string, data: any) {
    const supabase = await createClient();

    const {
        name,
        address,
        ownershipType,
        usageType,
        floorArea,
        contract
    } = data;

    // 1. Update real estate
    const { error: reError } = await supabase
        .from('real_estates')
        .update({
            name,
            address,
            ownership_type: ownershipType,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (reError) throw reError;

    // 2. Update usage info (assuming 1-to-1 usage for simplicity per modal design)
    if (usageType) {
        // Since we didn't specify UNIQUE on real_estate_id for usages (though logically we could have),
        // we'll delete and re-insert if multiple exist, or just use delete-insert.
        await supabase.from('real_estate_usages').delete().eq('real_estate_id', id);
        await supabase.from('real_estate_usages').insert({
            real_estate_id: id,
            usage_type: usageType,
            floor_area: floorArea ? parseFloat(floorArea) : null
        });
    }

    // 3. Update/upsert contract info
    if (ownershipType === 'leased') {
        if (contract) {
            const { landlord, monthlyRent, startDate, endDate, alertDaysBefore } = contract;
            const { error: cError } = await supabase.from('real_estate_contracts').upsert({
                real_estate_id: id,
                landlord: landlord || '未設定',
                monthly_rent: monthlyRent ? parseInt(monthlyRent, 10) : 0,
                start_date: startDate || new Date().toISOString().split('T')[0],
                end_date: endDate || new Date().toISOString().split('T')[0],
                alert_days_before: alertDaysBefore ? parseInt(alertDaysBefore, 10) : 90
            }, { onConflict: 'real_estate_id' });
            if (cError) console.error('Failed to upsert contract info:', cError);
        }
    } else if (ownershipType === 'owned') {
        await supabase.from('real_estate_contracts').delete().eq('real_estate_id', id);
    }

    revalidatePath('/real-estates');
    revalidatePath(`/real-estates/${id}`);
    return { success: true };
}

export async function deleteRealEstate(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('real_estates')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/real-estates');
    return { success: true };
}
