import type { NextApiRequest, NextApiResponse } from 'next'
import type { WorkloadHistory } from '@/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()
    const id = req.query.id as string

    const workloads: WorkloadHistory[] = [
        { id: 'wl_1', employeeId: id, workload: 1.0, startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31') },
        { id: 'wl_2', employeeId: id, workload: 0.8, startDate: new Date('2024-04-01'), endDate: null },
    ]

    return res.status(200).json(workloads)
}
