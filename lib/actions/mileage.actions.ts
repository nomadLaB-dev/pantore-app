import { createClient } from '@/lib/supabase/client'

export async function createMileage(vehicleId: string, data: any) {
    const supabase = createClient()
    const payload = {
        id: crypto.randomUUID(),
        vehicle_id: vehicleId,
        record_date: data.record_date,
        mileage: data.mileage ? Number(data.mileage) : 0,
    }

    const { error } = await supabase.from('vehicle_mileage').insert(payload)
    if (error) throw error

    return { success: true }
}

export async function updateMileage(vehicleId: string, mileageId: string, data: any) {
    const supabase = createClient()
    const payload = {
        record_date: data.record_date,
        mileage: data.mileage ? Number(data.mileage) : 0,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
        .from('vehicle_mileage')
        .update(payload)
        .eq('id', mileageId)

    if (error) throw error

    return { success: true }
}

export async function deleteMileage(vehicleId: string, mileageId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('vehicle_mileage')
        .delete()
        .eq('id', mileageId)

    if (error) throw error

    return { success: true }
}
