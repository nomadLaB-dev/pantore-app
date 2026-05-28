'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createMileage(vehicleId: string, data: any) {
    const supabase = await createClient();
    const payload = {
        id: crypto.randomUUID(),
        vehicle_id: vehicleId,
        record_date: data.record_date,
        mileage: data.mileage ? Number(data.mileage) : 0,
    };

    const { error } = await supabase.from('vehicle_mileage').insert(payload);

    if (error) throw error;

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath('/vehicles');
    return { success: true };
}

export async function updateMileage(vehicleId: string, mileageId: string, data: any) {
    const supabase = await createClient();
    const payload = {
        record_date: data.record_date,
        mileage: data.mileage ? Number(data.mileage) : 0,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('vehicle_mileage')
        .update(payload)
        .eq('id', mileageId);

    if (error) throw error;

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath('/vehicles');
    return { success: true };
}

export async function deleteMileage(vehicleId: string, mileageId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('vehicle_mileage')
        .delete()
        .eq('id', mileageId);

    if (error) throw error;

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath('/vehicles');
    return { success: true };
}
