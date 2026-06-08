import type { NextApiRequest, NextApiResponse } from 'next'
import { mockEmploymentHistory } from '@/lib/mocks/employees'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()
    const id = req.query.id as string
    const history = mockEmploymentHistory
        .filter((h) => h.employeeId === id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    return res.status(200).json(history)
}
