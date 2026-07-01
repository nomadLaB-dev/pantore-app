import { createClient } from '@/lib/supabase/client'

export async function createRealEstate(data: any) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const {
        tenantId, branchesId, officeRegistrationStatus,
        name, address, ownershipType, usageType, floorArea,
        contract, restFacility, garage
    } = data

    const { data: estate, error: reError } = await supabase
        .from('real_estates')
        .insert({
            tenant_id: tenantId,
            branches_id: branchesId || null,
            office_registration_status: officeRegistrationStatus || 'not_applied',
            name, address,
            ownership_type: ownershipType
        })
        .select()
        .single()

    if (reError) throw reError

    if (usageType) {
        const { error: uError } = await supabase.from('real_estate_usages').insert({
            real_estate_id: estate.id,
            usage_type: usageType,
            floor_area: floorArea ? parseFloat(floorArea) : null
        })
        if (uError) console.error('Failed to insert usage info:', uError)
    }

    if (ownershipType === 'leased' && contract) {
        const { landlord, monthlyRent, startDate, endDate, alertDaysBefore } = contract
        const { error: cError } = await supabase.from('real_estate_contracts').insert({
            real_estate_id: estate.id,
            landlord: landlord || '未設定',
            monthly_rent: monthlyRent ? parseInt(monthlyRent, 10) : 0,
            start_date: startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || new Date().toISOString().split('T')[0],
            alert_days_before: alertDaysBefore ? parseInt(alertDaysBefore, 10) : 90
        })
        if (cError) console.error('Failed to insert contract info:', cError)
    }

    if (usageType === 'office' && restFacility) {
        const isAttached = restFacility.isAttachedToOffice
        const fAddress = isAttached ? address : restFacility.address
        const fLandlord = isAttached ? (contract?.landlord || '') : (restFacility.landlord || '')
        const fRent = isAttached ? 0 : (restFacility.monthlyRent ? parseInt(restFacility.monthlyRent, 10) : 0)
        const fStart = isAttached ? (contract?.startDate || null) : (restFacility.startDate || null)
        const fEnd = isAttached ? (contract?.endDate || null) : (restFacility.endDate || null)

        const { error: rfError } = await supabase.from('real_estates_rest_facilities').insert({
            real_estate_id: estate.id,
            is_attached_to_office: isAttached,
            address: fAddress, landlord: fLandlord,
            monthly_rent: fRent, start_date: fStart, end_date: fEnd
        })
        if (rfError) console.error('Failed to insert rest facility info:', rfError)
    }

    if (usageType === 'office' && garage) {
        const isAttached = garage.isAttachedToOffice
        const gAddress = isAttached ? address : garage.address
        const gLandlord = isAttached ? (contract?.landlord || '') : (garage.landlord || '')
        const gRent = isAttached ? 0 : (garage.monthlyRent ? parseInt(garage.monthlyRent, 10) : 0)
        const gStart = isAttached ? (contract?.startDate || null) : (garage.startDate || null)
        const gEnd = isAttached ? (contract?.endDate || null) : (garage.endDate || null)
        const gCapacity = garage.capacity ? parseInt(garage.capacity, 10) : null

        const { error: gError } = await supabase.from('real_estates_garages').insert({
            real_estate_id: estate.id,
            is_attached_to_office: isAttached,
            address: gAddress, landlord: gLandlord,
            monthly_rent: gRent, start_date: gStart, end_date: gEnd, capacity: gCapacity
        })
        if (gError) console.error('Failed to insert garage info:', gError)
    }

    return estate
}

export async function updateRealEstate(id: string, data: any) {
    const supabase = createClient()

    const {
        tenantId, branchesId, officeRegistrationStatus,
        name, address, ownershipType, usageType, floorArea,
        contract, restFacility, garage
    } = data

    const { error: reError } = await supabase
        .from('real_estates')
        .update({
            tenant_id: tenantId,
            branches_id: branchesId || null,
            office_registration_status: officeRegistrationStatus,
            name, address,
            ownership_type: ownershipType,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (reError) throw reError

    if (usageType) {
        await supabase.from('real_estate_usages').delete().eq('real_estate_id', id)
        await supabase.from('real_estate_usages').insert({
            real_estate_id: id,
            usage_type: usageType,
            floor_area: floorArea ? parseFloat(floorArea) : null
        })
    }

    if (ownershipType === 'leased') {
        if (contract) {
            const { landlord, monthlyRent, startDate, endDate, alertDaysBefore } = contract
            const { error: cError } = await supabase.from('real_estate_contracts').upsert({
                real_estate_id: id,
                landlord: landlord || '未設定',
                monthly_rent: monthlyRent ? parseInt(monthlyRent, 10) : 0,
                start_date: startDate || new Date().toISOString().split('T')[0],
                end_date: endDate || new Date().toISOString().split('T')[0],
                alert_days_before: alertDaysBefore ? parseInt(alertDaysBefore, 10) : 90
            }, { onConflict: 'real_estate_id' })
            if (cError) console.error('Failed to upsert contract info:', cError)
        }
    } else if (ownershipType === 'owned') {
        await supabase.from('real_estate_contracts').delete().eq('real_estate_id', id)
    }

    await supabase.from('real_estates_rest_facilities').delete().eq('real_estate_id', id)
    if (usageType === 'office' && restFacility) {
        const isAttached = restFacility.isAttachedToOffice
        const fAddress = isAttached ? address : restFacility.address
        const fLandlord = isAttached ? (contract?.landlord || '') : (restFacility.landlord || '')
        const fRent = isAttached ? 0 : (restFacility.monthlyRent ? parseInt(restFacility.monthlyRent, 10) : 0)
        const fStart = isAttached ? (contract?.startDate || null) : (restFacility.startDate || null)
        const fEnd = isAttached ? (contract?.endDate || null) : (restFacility.endDate || null)

        const { error: rfError } = await supabase.from('real_estates_rest_facilities').insert({
            real_estate_id: id,
            is_attached_to_office: isAttached,
            address: fAddress, landlord: fLandlord,
            monthly_rent: fRent, start_date: fStart, end_date: fEnd
        })
        if (rfError) console.error('Failed to insert rest facility info on update:', rfError)
    }

    await supabase.from('real_estates_garages').delete().eq('real_estate_id', id)
    if (usageType === 'office' && garage) {
        const isAttached = garage.isAttachedToOffice
        const gAddress = isAttached ? address : garage.address
        const gLandlord = isAttached ? (contract?.landlord || '') : (garage.landlord || '')
        const gRent = isAttached ? 0 : (garage.monthlyRent ? parseInt(garage.monthlyRent, 10) : 0)
        const gStart = isAttached ? (contract?.startDate || null) : (garage.startDate || null)
        const gEnd = isAttached ? (contract?.endDate || null) : (garage.endDate || null)
        const gCapacity = garage.capacity ? parseInt(garage.capacity, 10) : null

        const { error: gError } = await supabase.from('real_estates_garages').insert({
            real_estate_id: id,
            is_attached_to_office: isAttached,
            address: gAddress, landlord: gLandlord,
            monthly_rent: gRent, start_date: gStart, end_date: gEnd, capacity: gCapacity
        })
        if (gError) console.error('Failed to insert garage info on update:', gError)
    }

    return { success: true }
}

export async function deleteRealEstate(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('real_estates')
        .delete()
        .eq('id', id)

    if (error) throw error

    return { success: true }
}

export async function deleteAllRealEstates() {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { error } = await supabase.from('real_estates').delete().neq('id', '')
    if (error) throw error

    return { success: true }
}
