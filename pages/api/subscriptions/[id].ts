import type { NextApiRequest, NextApiResponse } from 'next'
import { mockSubscriptionPriceHistory, mockSubscriptions } from '@/lib/mocks/subscriptions'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    const id = req.query.id as string
    const sub = mockSubscriptions.find((s) => s.id === id)
    if (!sub) return res.status(404).json({ error: 'Not found' })

    const history = mockSubscriptionPriceHistory
        .filter((h) => h.subscriptionId === id)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())

    return res.status(200).json({ ...sub, priceHistory: history })
}
