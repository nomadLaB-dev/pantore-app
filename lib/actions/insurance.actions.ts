import { createClient } from '@/lib/supabase/client'

export async function createInsurance(vehicleId: string, data: any) {
    const supabase = createClient()

    const payload = {
        vehicle_id: vehicleId,
        company_name: data.companyName,
        type: data.type,
        start_date: data.startDate,
        end_date: data.endDate,
        premium_amount: data.premiumAmount ? Number(data.premiumAmount) : null,
        coverage_details: data.coverageDetails,
    }

    const { error } = await supabase.from('vehicle_insurances').insert(payload)
    if (error) throw error

    return { success: true }
}

export async function updateInsurance(vehicleId: string, insuranceId: string, data: any) {
    const supabase = createClient()

    const payload = {
        company_name: data.companyName,
        type: data.type,
        start_date: data.startDate,
        end_date: data.endDate,
        premium_amount: data.premiumAmount ? Number(data.premiumAmount) : null,
        coverage_details: data.coverageDetails,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
        .from('vehicle_insurances')
        .update(payload)
        .eq('id', insuranceId)

    if (error) throw error

    return { success: true }
}

export async function deleteInsurance(vehicleId: string, insuranceId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('vehicle_insurances')
        .delete()
        .eq('id', insuranceId)

    if (error) throw error

    return { success: true }
}
