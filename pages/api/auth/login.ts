import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()

    try {
        const { email, password } = req.body

        if (email && password) {
            const supabase = createClient(req, res)
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })

            if (error) {
                console.error('Login error:', error.message)
                return res.status(401).json({ error: error.message })
            }

            return res.status(200).json({
                id: data.user.id,
                email: data.user.email,
                passwordHash: '',
                role: 'admin',
                createdAt: data.user.created_at,
            })
        }

        return res.status(401).json({ error: 'Invalid credentials' })
    } catch (error) {
        console.error('API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
