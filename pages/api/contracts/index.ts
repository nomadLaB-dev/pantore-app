import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    const supabase = createClient(req, res)

    const [vehicleLeasesRes, realEstateContractsRes] = await Promise.all([
        supabase.from('vehicle_leases').select(`
            id, vehicle_id, lease_company, contract_start_date, contract_end_date, monthly_fee,
            vehicles(id, manufacturer, model, license_plate)
        `),
        supabase.from('real_estate_contracts').select(`
            id, real_estate_id, start_date, end_date, alert_days_before, monthly_rent, landlord,
            real_estates(id, name)
        `),
    ])

    const allContracts: any[] = []

    if (vehicleLeasesRes.data) {
        for (const vl of vehicleLeasesRes.data) {
            const v = Array.isArray((vl as any).vehicles) ? (vl as any).vehicles[0] : (vl as any).vehicles
            allContracts.push({
                id: vl.id,
                relatedType: 'vehicle',
                relatedId: v?.id || vl.vehicle_id,
                relatedName: v ? `${v.manufacturer} ${v.model}（${v.license_plate}）` : '不明な車両',
                startDate: vl.contract_start_date,
                endDate: vl.contract_end_date,
                alertDaysBefore: 60,
                monthlyFee: vl.monthly_fee,
                counterparty: vl.lease_company,
            })
        }
    }

    if (realEstateContractsRes.data) {
        for (const rc of realEstateContractsRes.data) {
            const r = Array.isArray((rc as any).real_estates) ? (rc as any).real_estates[0] : (rc as any).real_estates
            allContracts.push({
                id: rc.id,
                relatedType: 'real_estate',
                relatedId: r?.id || rc.real_estate_id,
                relatedName: r?.name || '不明な不動産',
                startDate: rc.start_date,
                endDate: rc.end_date,
                alertDaysBefore: rc.alert_days_before || 90,
                monthlyFee: rc.monthly_rent,
                counterparty: rc.landlord,
            })
        }
    }

    const now = new Date()
    const withDaysLeft = allContracts.map((c) => {
        const daysLeft = Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { ...c, daysLeft }
    })

    return res.status(200).json(withDaysLeft.sort((a, b) => a.daysLeft - b.daysLeft))
}
