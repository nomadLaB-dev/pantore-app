import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

async function getTenantId(supabase: ReturnType<typeof createClient>) {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data } = await supabase.from('users').select('tenant_id').eq('user_id', user.id).single()
    return data?.tenant_id ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: true })
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json((data ?? []).map(toClient))
    }

    if (req.method === 'POST') {
        const tenantId = await getTenantId(supabase)
        if (!tenantId) return res.status(401).json({ error: 'Unauthorized' })

        const b = req.body
        const areas: string[] = parseAreas(b.areas)

        if (b.category === 'courier' && areas.length === 0) {
            return res.status(400).json({ error: 'ファーストエリアは必須です' })
        }

        const { data, error } = await supabase
            .from('clients')
            .insert({
                tenant_id:       tenantId,
                category:        b.category        || 'other',
                company_name:    b.companyName      || b.company_name || '',
                areas,
                department:      b.department       || null,
                contact_name:    b.contactName      || b.contact_name  || null,
                contact_email:   b.contactEmail     || b.contact_email || null,
                contact_phone:   b.contactPhone     || b.contact_phone || null,
                billing_name:    b.billingName      || b.billing_name  || null,
                billing_email:   b.billingEmail     || b.billing_email || null,
                billing_address: b.billingAddress   || b.billing_address || null,
            })
            .select('*')
            .single()
        if (error) return res.status(500).json({ error: error.message })
        return res.status(201).json(toClient(data))
    }

    return res.status(405).end()
}

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
