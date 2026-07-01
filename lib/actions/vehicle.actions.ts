import { createClient } from '@/lib/supabase/client'

export async function createVehicle(data: any) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const {
        manufacturer, model, licensePlate, licensePlateColor,
        ownershipType, branchId, companyId, tireType, lease, purchase, isTransportBureauApplied
    } = data

    const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .insert({
            tenant_id: companyId,
            branch_id: branchId || null,
            manufacturer, model,
            license_plate: licensePlate,
            license_plate_color: licensePlateColor,
            ownership_type: ownershipType,
            tire_type: tireType || 'normal',
            is_transport_bureau_applied: isTransportBureauApplied || false
        })
        .select()
        .single()

    if (vError) throw vError

    if (ownershipType === 'leased' && lease) {
        const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = lease
        const parsedMonthlyFee = monthlyFee && !isNaN(Number(monthlyFee)) ? parseInt(monthlyFee, 10) : 0
        const { error: lError } = await supabase.from('vehicle_leases').insert({
            vehicle_id: vehicle.id,
            lease_company: leaseCompany || '未設定',
            contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
            contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
            monthly_fee: parsedMonthlyFee,
        })
        if (lError) {
            console.error('Failed to insert lease info:', lError)
            await supabase.from('vehicles').delete().eq('id', vehicle.id)
            throw lError
        }
    } else if (ownershipType === 'owned' && purchase) {
        const { acquisitionCost, purchaseDate, bodyType, isNewCar, method } = purchase
        const parsedAcquisitionCost = acquisitionCost && !isNaN(Number(acquisitionCost)) ? parseInt(acquisitionCost, 10) : 0
        const { error: pError } = await supabase.from('vehicle_purchases').insert({
            vehicle_id: vehicle.id,
            acquisition_cost: parsedAcquisitionCost,
            purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
            first_registration_date: null,
            body_type: bodyType || 'passenger_standard',
            is_new_car: isNewCar !== undefined ? Boolean(isNewCar) : true,
            method: method || 'straight'
        })
        if (pError) {
            console.error('Failed to insert purchase info:', pError)
            await supabase.from('vehicles').delete().eq('id', vehicle.id)
            throw pError
        }
    }

    return vehicle
}

export async function updateVehicle(id: string, data: any) {
    const supabase = createClient()

    const {
        manufacturer, model, licensePlate, licensePlateColor,
        ownershipType, branchId, tireType, lease, purchase, isTransportBureauApplied
    } = data

    const { error: vError } = await supabase
        .from('vehicles')
        .update({
            manufacturer, model,
            license_plate: licensePlate,
            license_plate_color: licensePlateColor,
            ownership_type: ownershipType,
            branch_id: branchId,
            tire_type: tireType || 'normal',
            is_transport_bureau_applied: isTransportBureauApplied || false,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (vError) throw vError

    if (ownershipType === 'leased') {
        if (lease) {
            const { leaseCompany, contractStartDate, contractEndDate, monthlyFee } = lease
            const { error: lError } = await supabase.from('vehicle_leases').upsert({
                vehicle_id: id,
                lease_company: leaseCompany || '未設定',
                contract_start_date: contractStartDate || new Date().toISOString().split('T')[0],
                contract_end_date: contractEndDate || new Date().toISOString().split('T')[0],
                monthly_fee: monthlyFee ? parseInt(monthlyFee, 10) : 0,
            }, { onConflict: 'vehicle_id' })
            if (lError) console.error('Failed to upsert lease info:', lError)
        }
        await supabase.from('vehicle_purchases').delete().eq('vehicle_id', id)
    } else if (ownershipType === 'owned') {
        if (purchase) {
            const { acquisitionCost, purchaseDate, firstRegistrationDate, bodyType, isNewCar, method } = purchase
            const { error: pError } = await supabase.from('vehicle_purchases').upsert({
                vehicle_id: id,
                acquisition_cost: acquisitionCost ? parseInt(acquisitionCost, 10) : 0,
                purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
                first_registration_date: firstRegistrationDate || null,
                body_type: bodyType || 'passenger_standard',
                is_new_car: isNewCar !== undefined ? Boolean(isNewCar) : true,
                method: method || 'straight'
            }, { onConflict: 'vehicle_id' })
            if (pError) console.error('Failed to upsert purchase info:', pError)
        }
        await supabase.from('vehicle_leases').delete().eq('vehicle_id', id)
    }

    return { success: true }
}

export async function deleteAllVehicles() {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { error } = await supabase.from('vehicles').delete().neq('id', '')
    if (error) throw error

    return { success: true }
}

export async function updateVehiclePurchase(vehicleId: string, purchase: any) {
    const supabase = createClient()

    const { acquisitionCost, purchaseDate, firstRegistrationDate, bodyType, isNewCar, method } = purchase

    const { error: pError } = await supabase.from('vehicle_purchases').upsert({
        vehicle_id: vehicleId,
        acquisition_cost: acquisitionCost ? parseInt(acquisitionCost, 10) : 0,
        purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
        first_registration_date: firstRegistrationDate || null,
        body_type: bodyType || 'passenger_standard',
        is_new_car: isNewCar !== undefined ? Boolean(isNewCar) : true,
        method: method || 'straight',
        updated_at: new Date().toISOString()
    }, { onConflict: 'vehicle_id' })

    if (pError) throw pError

    return { success: true }
}

export async function createVehicleAccident(vehicleId: string, data: any) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const payload = {
        vehicle_id: vehicleId,
        accident_date: data.accident_date,
        description: data.description,
        severity: data.severity || 'low',
        repair_cost: data.repair_cost ? parseInt(data.repair_cost, 10) : null,
        is_bodily_injury: data.is_bodily_injury !== undefined ? Boolean(data.is_bodily_injury) : false,
        is_property_damage: data.is_property_damage !== undefined ? Boolean(data.is_property_damage) : false,
    }

    const { data: accident, error } = await supabase
        .from('vehicle_accidents')
        .insert(payload)
        .select()
        .single()

    if (error) throw error

    return accident
}

export async function updateVehicleAccident(vehicleId: string, accidentId: string, data: any) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const payload = {
        accident_date: data.accident_date,
        description: data.description,
        severity: data.severity || 'low',
        repair_cost: data.repair_cost ? parseInt(data.repair_cost, 10) : null,
        is_bodily_injury: data.is_bodily_injury !== undefined ? Boolean(data.is_bodily_injury) : false,
        is_property_damage: data.is_property_damage !== undefined ? Boolean(data.is_property_damage) : false,
        updated_at: new Date().toISOString()
    }

    const { data: accident, error } = await supabase
        .from('vehicle_accidents')
        .update(payload)
        .eq('id', accidentId)
        .select()
        .single()

    if (error) throw error

    return accident
}

export async function deleteAccidents(vehicleId: string, accidentsId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('vehicle_accidents')
        .delete()
        .eq('id', accidentsId)

    if (error) throw error

    return { success: true }
}
