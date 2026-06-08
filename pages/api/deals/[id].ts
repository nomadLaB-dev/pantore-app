import type { NextApiRequest, NextApiResponse } from 'next'
import {
    mockClients, mockDeals, mockDealAssignees,
    mockInvoices, mockContracts, mockMinutes,
} from '@/lib/mocks/deals'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string

    if (req.method === 'GET') {
        const deal = mockDeals.find((d) => d.id === id)
        if (!deal) return res.status(404).json({ error: 'Not found' })

        const assignees = mockDealAssignees
            .filter((a) => a.dealId === id)
            .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())

        return res.status(200).json({
            ...deal,
            client: mockClients.find((c) => c.id === deal.clientId) ?? null,
            currentAssignee: assignees[0] ?? null,
            assigneeHistory: assignees,
            invoices: mockInvoices.filter((i) => i.dealId === id),
            contracts: mockContracts.filter((c) => c.dealId === id),
            minutes: mockMinutes.filter((m) => m.dealId === id),
        })
    }

    if (req.method === 'PUT') {
        const idx = mockDeals.findIndex((d) => d.id === id)
        if (idx === -1) return res.status(404).json({ error: 'Not found' })
        Object.assign(mockDeals[idx], req.body)
        return res.status(200).json(mockDeals[idx])
    }

    return res.status(405).end()
}
