import type { NextApiRequest, NextApiResponse } from 'next'
import {
    mockClients, mockDeals, mockDealAssignees,
    mockInvoices, mockContracts, mockMinutes,
} from '@/lib/mocks/deals'

function enrich(d: typeof mockDeals[0]) {
    const assignees = mockDealAssignees
        .filter((a) => a.dealId === d.id)
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    return {
        ...d,
        client: mockClients.find((c) => c.id === d.clientId) ?? null,
        currentAssignee: assignees[0] ?? null,
        assigneeHistory: assignees,
        invoices: mockInvoices.filter((i) => i.dealId === d.id),
        contracts: mockContracts.filter((c) => c.dealId === d.id),
        minutes: mockMinutes.filter((m) => m.dealId === d.id),
    }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return res.status(200).json(mockDeals.map(enrich))
    }

    if (req.method === 'POST') {
        try {
            const body = req.body
            const newDeal = { ...body, id: `d_${Date.now()}`, status: 'active', createdAt: new Date() }
            mockDeals.push(newDeal)

            if (body.assigneeName) {
                mockDealAssignees.push({
                    id: `da_${Date.now()}`,
                    dealId: newDeal.id,
                    assigneeName: body.assigneeName,
                    assigneeEmail: '',
                    assignedAt: new Date(),
                    handoverNote: '新規案件登録によるアサイン',
                })
            }

            return res.status(201).json(newDeal)
        } catch {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    return res.status(405).end()
}
