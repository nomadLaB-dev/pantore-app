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
        lease,
        purchase
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
    } else if (ownershipType === 'owned' && purchase) {
        const { acquisitionCost, purchaseDate, firstRegistrationDate, bodyType, isNewCar, method } = purchase;
        const { error: pError } = await supabase.from('vehicle_purchases').insert({
            vehicle_id: vehicle.id,
            acquisition_cost: acquisitionCost ? parseInt(acquisitionCost, 10) : 0,
            purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
            first_registration_date: firstRegistrationDate || null,
            body_type: bodyType || 'passenger_standard',
            is_new_car: isNewCar !== undefined ? Boolean(isNewCar) : true,
            method: method || 'straight'
        });
        if (pError) console.error('Failed to insert purchase info:', pError);
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
        lease,
        purchase
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

    // 2. Update/upsert lease or purchase info
    if (ownershipType === 'leased') {
        if (lease) {
            const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = lease;
            const { error: lError } = await supabase.from('vehicle_leases').upsert({
                vehicle_id: id,
                lease_company: leaseCompany || '未設定',
                contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
                contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
                monthly_fee: monthlyFee ? parseInt(monthlyFee, 10) : 0,
            }, { onConflict: 'vehicle_id' });
            if (lError) console.error('Failed to upsert lease info:', lError);
        }
        await supabase.from('vehicle_purchases').delete().eq('vehicle_id', id);
    } else if (ownershipType === 'owned') {
        if (purchase) {
            const { acquisitionCost, purchaseDate, firstRegistrationDate, bodyType, isNewCar, method } = purchase;
            const { error: pError } = await supabase.from('vehicle_purchases').upsert({
                vehicle_id: id,
                acquisition_cost: acquisitionCost ? parseInt(acquisitionCost, 10) : 0,
                purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
                first_registration_date: firstRegistrationDate || null,
                body_type: bodyType || 'passenger_standard',
                is_new_car: isNewCar !== undefined ? Boolean(isNewCar) : true,
                method: method || 'straight'
            }, { onConflict: 'vehicle_id' });
            if (pError) console.error('Failed to upsert purchase info:', pError);
        }
        await supabase.from('vehicle_leases').delete().eq('vehicle_id', id);
    }

    revalidatePath('/vehicles');
    revalidatePath(`/vehicles/${id}`);
    return { success: true };
}

export async function updateVehiclePurchase(vehicleId: string, purchase: any) {
    const supabase = await createClient();

    const { acquisitionCost, purchaseDate, firstRegistrationDate, bodyType, isNewCar, method } = purchase;

    const { error: pError } = await supabase.from('vehicle_purchases').upsert({
        vehicle_id: vehicleId,
        acquisition_cost: acquisitionCost ? parseInt(acquisitionCost, 10) : 0,
        purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
        first_registration_date: firstRegistrationDate || null,
        body_type: bodyType || 'passenger_standard',
        is_new_car: isNewCar !== undefined ? Boolean(isNewCar) : true,
        method: method || 'straight'
    }, { onConflict: 'vehicle_id' });

    if (pError) throw pError;

    revalidatePath('/vehicles');
    revalidatePath(`/vehicles/${vehicleId}`);
    return { success: true };
}
