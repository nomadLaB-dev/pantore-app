import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    const supabase = createClient(req, res)
    const id = req.query.id as string

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    const { data: s, error } = await supabase
        .from('specimens')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !s) return res.status(404).json({ error: 'Not found' })

    return res.status(200).json({
        id: s.id,
        patient: s.patient_name,
        type: s.specimen_type,
        collectDate: s.collect_date,
        status: s.status,
        priority: s.priority,
        clinic: s.clinic,
        doctor: s.doctor,
        notes: s.notes,
        timeline: s.timeline,
    })
}
