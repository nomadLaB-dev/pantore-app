import { createClient } from '@/lib/supabase/client'

export async function createInspection(vehicleId: string, data: any) {
    const supabase = createClient()
    const payload = {
        id: crypto.randomUUID(),
        vehicle_id: vehicleId,
        accidents_id: data.accidents_id || null,
        inspection_type: data.inspection_type,
        inspection_start_date: data.inspection_start_date,
        inspection_end_date: data.inspection_end_date || data.inspection_start_date,
        inspection_cost: data.inspection_cost ? parseInt(data.inspection_cost, 10) : 0,
        next_inspection_mileage: data.next_inspection_mileage ? parseInt(data.next_inspection_mileage, 10) : null,
        next_inspection_date: data.next_inspection_date || null,
        notes: data.notes || null,
    }

    const { error } = await supabase.from('vehicle_inspection').insert(payload)
    if (error) throw error

    return { success: true }
}

export async function updateInspection(vehicleId: string, inspectionId: string, data: any) {
    const supabase = createClient()
    const payload = {
        accidents_id: data.accidents_id || null,
        inspection_type: data.inspection_type,
        inspection_start_date: data.inspection_start_date,
        inspection_end_date: data.inspection_end_date || data.inspection_start_date,
        inspection_cost: data.inspection_cost ? parseInt(data.inspection_cost, 10) : 0,
        next_inspection_mileage: data.next_inspection_mileage ? parseInt(data.next_inspection_mileage, 10) : null,
        next_inspection_date: data.next_inspection_date || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
        .from('vehicle_inspection')
        .update(payload)
        .eq('id', inspectionId)

    if (error) throw error

    return { success: true }
}

export async function deleteInspection(vehicleId: string, inspectionId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('vehicle_inspection')
        .delete()
        .eq('id', inspectionId)

    if (error) throw error

    return { success: true }
}
