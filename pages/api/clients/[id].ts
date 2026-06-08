import type { NextApiRequest, NextApiResponse } from 'next'
import { mockClients, mockDeals, mockInvoices, mockContracts } from '@/lib/mocks/deals'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    const id = req.query.id as string
    const client = mockClients.find((c) => c.id === id)
    if (!client) return res.status(404).json({ error: 'Not found' })

    const deals = mockDeals.filter((d) => d.clientId === id)
    const dealIds = deals.map((d) => d.id)
    const invoices = mockInvoices.filter((i) => dealIds.includes(i.dealId))
    const contracts = mockContracts.filter((c) => dealIds.includes(c.dealId))

    return res.status(200).json({ ...client, deals, invoices, contracts })
}
