import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    const supabase = createClient(req, res)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    return res.status(200).json({
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
    })
}
