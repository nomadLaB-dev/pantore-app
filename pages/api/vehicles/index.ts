import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    try {
        const supabase = createClient(req, res)

        const { data: dbVehicles, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                branch:branches(*),
                accidents:vehicle_accidents(*),
                inspections:vehicle_inspection(*)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Failed to fetch vehicles in API:', error.message)
            return res.status(500).json({ error: '車両データの取得に失敗しました' })
        }

        const vehicles = (dbVehicles || []).map((vehicle: any) => ({
            id: vehicle.id,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            licensePlate: vehicle.license_plate,
            licensePlateColor: vehicle.license_plate_color,
            ownershipType: vehicle.ownership_type,
            branchId: vehicle.branch_id,
            tireType: vehicle.tire_type,
            branch: vehicle.branch ? { id: vehicle.branch.id, name: vehicle.branch.name } : null,
            accidents: (vehicle.accidents || []).map((acc: any) => ({
                id: acc.id,
                accidentDate: acc.accident_date,
                description: acc.description,
                severity: acc.severity,
            })),
            inspections: (vehicle.inspections || []).map((insp: any) => ({
                id: insp.id,
                accidentsId: insp.accidents_id,
                inspectionType: insp.inspection_type,
                inspectionStartDate: insp.inspection_start_date,
                inspectionEndDate: insp.inspection_end_date,
            })),
            createdAt: vehicle.created_at,
            updatedAt: vehicle.updated_at,
        }))

        return res.status(200).json(vehicles)
    } catch (error) {
        console.error('API vehicles handler error:', error)
        return res.status(500).json({ error: '予期せぬエラーが発生しました' })
    }
}
