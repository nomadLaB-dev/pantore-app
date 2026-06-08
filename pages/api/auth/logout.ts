import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()

    try {
        const supabase = createClient(req, res)
        await supabase.auth.signOut()
        return res.status(200).json({ success: true })
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' })
    }
}
