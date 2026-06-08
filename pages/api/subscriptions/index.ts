import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { mockEmployees } from '@/lib/mocks/employees'
import { mockSubscriptionPriceHistory, mockSubscriptions, getLatestPrice } from '@/lib/mocks/subscriptions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: dbBranches } = await supabase.from('branches').select('*')
        const branches = dbBranches || []

        const withRelations = mockSubscriptions.map((s) => {
            const latest = getLatestPrice(s.id)
            return {
                ...s,
                currentAmount: latest?.amount ?? null,
                currentCurrency: latest?.currency ?? s.currentCurrency,
                branch: branches.find((b: { id: string; name: string }) => b.id === s.branchId) ?? null,
                assignee: mockEmployees.find((e) => e.id === s.assigneeEmployeeId) ?? null,
                priceHistoryCount: mockSubscriptionPriceHistory.filter((h) => h.subscriptionId === s.id).length,
            }
        })
        return res.status(200).json(withRelations)
    }

    if (req.method === 'POST') {
        try {
            const body = req.body
            const newSub = { ...body, id: `s_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
            return res.status(201).json(newSub)
        } catch {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    return res.status(405).end()
}
