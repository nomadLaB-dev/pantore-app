import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    try {
        const supabase = createClient(req, res)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

        const areaId = req.query.areaId as string | undefined

        if (!areaId) {
            const { data: areas, error: areasError } = await supabase
                .from('areas')
                .select('*')
                .order('display_order', { ascending: true })
                .order('id', { ascending: true })

            if (areasError) return res.status(500).json({ error: areasError.message })
            return res.status(200).json({ areas })
        }

        const { data: prefectures, error: prefError } = await supabase
            .from('prefectures')
            .select('id')
            .eq('area_id', areaId)

        if (prefError) return res.status(500).json({ error: prefError.message })

        const prefIds = prefectures.map((p) => p.id)
        if (prefIds.length === 0) return res.status(200).json({ branches: [] })

        const { data: branches, error: branchesError } = await supabase
            .from('branches')
            .select('id, name, pref_id')
            .in('pref_id', prefIds)
            .order('name', { ascending: true })

        if (branchesError) return res.status(500).json({ error: branchesError.message })

        const branchIds = branches.map((b) => b.id)
        let employeeCounts: any[] = []

        if (branchIds.length > 0) {
            const jstOffset = 9 * 60 * 60 * 1000
            const todayStr = new Date(Date.now() + jstOffset).toISOString().split('T')[0]

            const { data, error: countError } = await supabase
                .from('users')
                .select('branch_id, contracted_hours_per_week_max, proficiency_rate')
                .in('branch_id', branchIds)
                .or(`leave_date.is.null,leave_date.gte.${todayStr}`)

            if (countError) return res.status(500).json({ error: countError.message })
            employeeCounts = data || []
        }

        const counts: Record<string, number> = {}
        const sumA: Record<string, number> = {}

        employeeCounts.forEach((e: any) => {
            if (e.branch_id) {
                counts[e.branch_id] = (counts[e.branch_id] || 0) + 1
                const maxHours = Number(e.contracted_hours_per_week_max || 0)
                const rate = e.proficiency_rate !== null ? Number(e.proficiency_rate) : 1.0
                sumA[e.branch_id] = (sumA[e.branch_id] || 0) + maxHours * rate
            }
        })

        const branchesWithCount = branches.map((b: any) => ({
            id: b.id,
            name: b.name,
            prefId: b.pref_id,
            employeeCount: counts[b.id] || 0,
            manWeeks: Number(((sumA[b.id] || 0) / 40).toFixed(2)),
        }))

        return res.status(200).json({ branches: branchesWithCount })
    } catch (e: any) {
        return res.status(500).json({ error: e.message })
    }
}
