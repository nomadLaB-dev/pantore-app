import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    try {
        const supabase = createClient(req, res)

        const { data: dbEstates, error } = await supabase
            .from('real_estates')
            .select(`
                *,
                branch:branches(*),
                usages:real_estate_usages(*),
                contracts:real_estate_contracts(*)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Failed to fetch real estates in API:', error.message)
            return res.status(500).json({ error: '不動産データの取得に失敗しました' })
        }

        const estates = (dbEstates || []).map((r: any) => {
            const contract = Array.isArray(r.contracts) ? r.contracts[0] : r.contracts

            return {
                id: r.id,
                tenantId: r.tenant_id,
                branchesId: r.branches_id,
                branch: r.branch ? { id: r.branch.id, name: r.branch.name } : null,
                officeRegistrationStatus: r.office_registration_status,
                name: r.name,
                address: r.address,
                ownershipType: r.ownership_type,
                usages: (r.usages || []).map((u: any) => ({ id: u.id, type: u.usage_type, floorArea: u.floor_area })),
                usageType: r.usages?.[0]?.usage_type ?? null,
                contract: contract ? {
                    landlord: contract.landlord,
                    monthlyRent: contract.monthly_rent,
                    startDate: contract.start_date,
                    endDate: contract.end_date,
                } : null,
                monthlyRent: contract?.monthly_rent ?? null,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            }
        })

        return res.status(200).json(estates)
    } catch (error) {
        console.error('API real-estates handler error:', error)
        return res.status(500).json({ error: '予期せぬエラーが発生しました' })
    }
}
