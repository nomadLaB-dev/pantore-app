import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)
    const id = req.query.id as string

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
        const { data: sub, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                branch:branches(id, name),
                assignee:users!subscriptions_assignee_employee_id_fkey(id, name)
            `)
            .eq('id', id)
            .single()

        if (error || !sub) return res.status(404).json({ error: 'Not found' })

        const { data: history } = await supabase
            .from('subscription_price_history')
            .select('*')
            .eq('subscription_id', id)
            .order('effective_from', { ascending: false })

        return res.status(200).json({
            id: sub.id,
            serviceName: sub.service_name,
            serviceUrl: sub.service_url,
            corporateName: sub.corporate_name,
            billingInterval: sub.billing_interval,
            branchId: sub.branch_id,
            assigneeEmployeeId: sub.assignee_employee_id,
            branch: sub.branch ?? null,
            assignee: sub.assignee ?? null,
            priceHistory: (history || []).map((h: any) => ({
                id: h.id,
                amount: h.amount,
                currency: h.currency,
                effectiveFrom: h.effective_from,
                note: h.note,
            })),
        })
    }

    if (req.method === 'POST') {
        const { amount, currency, effectiveFrom, note } = req.body

        const { error: histError } = await supabase.from('subscription_price_history').insert({
            subscription_id: id,
            amount,
            currency: currency || 'JPY',
            effective_from: effectiveFrom,
            note: note || null,
        })
        if (histError) return res.status(500).json({ error: histError.message })

        const { error: updError } = await supabase
            .from('subscriptions')
            .update({ current_amount: amount, current_currency: currency || 'JPY', updated_at: new Date().toISOString() })
            .eq('id', id)
        if (updError) return res.status(500).json({ error: updError.message })

        return res.status(201).json({ success: true })
    }

    return res.status(405).end()
}
