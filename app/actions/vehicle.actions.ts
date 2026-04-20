'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createVehicle(data: any) {
    const supabase = await createClient();

    // Get current employee/tenant details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
    if (empError || !employee) throw new Error('Employee not found');

    const {
        manufacturer,
        model,
        licensePlate,
        licensePlateColor,
        ownershipType,
        branchId,
        lease
    } = data;

    // 1. Insert vehicle
    const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .insert({
            tenant_id: employee.tenant_id,
            branch_id: branchId,
            manufacturer,
            model,
            license_plate: licensePlate,
            license_plate_color: licensePlateColor,
            ownership_type: ownershipType
        })
        .select()
        .single();

    if (vError) throw vError;

    // 2. Insert lease info
    if (ownershipType === 'leased' && lease) {
        const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = lease;
        const { error: lError } = await supabase.from('vehicle_leases').insert({
            vehicle_id: vehicle.id,
            lease_company: leaseCompany || '未設定',
            contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
            contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
            monthly_fee: monthlyFee ? parseInt(monthlyFee, 10) : 0,
        });
        if (lError) console.error('Failed to insert lease info:', lError);
    }

    revalidatePath('/vehicles');
    return vehicle;
}

export async function updateVehicle(id: string, data: any) {
    const supabase = await createClient();

    const {
        manufacturer,
        model,
        licensePlate,
        licensePlateColor,
        ownershipType,
        branchId,
        lease
    } = data;

    // 1. Update vehicle
    const { error: vError } = await supabase
        .from('vehicles')
        .update({
            manufacturer,
            model,
            license_plate: licensePlate,
            license_plate_color: licensePlateColor,
            ownership_type: ownershipType,
            branch_id: branchId,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (vError) throw vError;

    // 2. Update/upsert lease info
    if (ownershipType === 'leased' && lease) {
        const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = lease;
        const { error: lError } = await supabase.from('vehicle_leases').upsert({
            vehicle_id: id,
            lease_company: leaseCompany || '未設定',
            contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
            contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
            monthly_fee: monthlyFee ? parseInt(monthlyFee, 10) : 0,
        }, { onConflict: 'vehicle_id' });
        if (lError) console.error('Failed to upsert lease info:', lError);
    } else if (ownershipType === 'owned') {
        await supabase.from('vehicle_leases').delete().eq('vehicle_id', id);
    }

    revalidatePath('/vehicles');
    revalidatePath(`/vehicles/${id}`);
    return { success: true };
}
