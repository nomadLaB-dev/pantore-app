import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
        const { data: specimens, error } = await supabase
            .from('specimens')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) return res.status(500).json({ error: error.message })

        const result = (specimens || []).map((s: any) => ({
            id: s.id,
            patient: s.patient_name,
            type: s.specimen_type,
            date: s.collect_date,
            status: s.status,
            priority: s.priority,
            clinic: s.clinic,
            doctor: s.doctor,
            notes: s.notes,
            timeline: s.timeline,
        }))

        return res.status(200).json(result)
    }

    if (req.method === 'POST') {
        try {
            const { data: employee, error: empError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single()

            if (empError || !employee?.tenant_id) return res.status(403).json({ error: 'Tenant unassigned' })

            const { count } = await supabase
                .from('specimens')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', employee.tenant_id)

            const body = req.body
            const id = `SP-${String((count || 0) + 1).padStart(3, '0')}`

            const { data: created, error } = await supabase
                .from('specimens')
                .insert({
                    id,
                    tenant_id: employee.tenant_id,
                    patient_name: body.patient,
                    specimen_type: body.type,
                    collect_date: body.date || null,
                    status: body.status || '受付済',
                    priority: Boolean(body.priority),
                    clinic: body.clinic || null,
                    doctor: body.doctor || null,
                    notes: body.notes || null,
                    timeline: body.timeline || null,
                })
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            return res.status(201).json({ id: created.id })
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    return res.status(405).end()
}
