import type { NextApiRequest, NextApiResponse } from 'next'
import { mockClients } from '@/lib/mocks/deals'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return res.status(200).json(mockClients)
    }

    if (req.method === 'POST') {
        try {
            const body = req.body
            const newClient = { ...body, id: `cl_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
            mockClients.push(newClient)
            return res.status(201).json(newClient)
        } catch {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    return res.status(405).end()
}
