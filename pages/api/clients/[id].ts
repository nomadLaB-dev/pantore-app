import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'
import { mockDeals, mockInvoices, mockContracts } from '@/lib/mocks/deals'

function parseAreas(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean).slice(0, 10)
    if (typeof raw === 'string') return raw.split('|').map(s => s.trim()).filter(Boolean).slice(0, 10)
    return []
}

function toClient(d: any) {
    return {
        id:             d.id,
        category:       d.category,
        companyName:    d.company_name,
        areas:          d.areas ?? [],
        department:     d.department     ?? '',
        contactName:    d.contact_name   ?? '',
        contactEmail:   d.contact_email  ?? '',
        contactPhone:   d.contact_phone  ?? '',
        billingName:    d.billing_name   ?? '',
        billingEmail:   d.billing_email  ?? '',
        billingAddress: d.billing_address ?? '',
        createdAt:      d.created_at,
        updatedAt:      d.updated_at,
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)
    const id = req.query.id as string

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
        if (error || !data) return res.status(404).json({ error: 'Not found' })

        const deals     = mockDeals.filter((d) => d.clientId === id)
        const dealIds   = deals.map((d) => d.id)
        const invoices  = mockInvoices.filter((i) => dealIds.includes(i.dealId))
        const contracts = mockContracts.filter((c) => dealIds.includes(c.dealId))

        return res.status(200).json({ ...toClient(data), deals, invoices, contracts })
    }

    if (req.method === 'PATCH') {
        const b = req.body
        const patch: Record<string, any> = { updated_at: new Date().toISOString() }

        if ('areas' in b) {
            const areas = parseAreas(b.areas)
            if (b.category === 'courier' && areas.length === 0) {
                return res.status(400).json({ error: 'ファーストエリアは必須です' })
            }
            patch.areas = areas
        }

        const map: Record<string, string> = {
            department:     'department',
            contactName:    'contact_name',
            contactEmail:   'contact_email',
            contactPhone:   'contact_phone',
            billingName:    'billing_name',
            billingEmail:   'billing_email',
            billingAddress: 'billing_address',
        }
        for (const [jsKey, dbKey] of Object.entries(map)) {
            if (jsKey in b) patch[dbKey] = b[jsKey] || null
        }

        const { data, error } = await supabase
            .from('clients')
            .update(patch)
            .eq('id', id)
            .select('*')
            .single()
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json(toClient(data))
    }

    return res.status(405).end()
}
