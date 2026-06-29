import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
        const { data: subs, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                branch:branches(id, name),
                assignee:users!subscriptions_assignee_employee_id_fkey(id, name),
                priceHistory:subscription_price_history(id)
            `)
            .order('created_at', { ascending: false })

        if (error) return res.status(500).json({ error: error.message })

        const result = (subs || []).map((s: any) => ({
            id: s.id,
            serviceName: s.service_name,
            serviceUrl: s.service_url,
            corporateName: s.corporate_name,
            billingInterval: s.billing_interval,
            branchId: s.branch_id,
            assigneeEmployeeId: s.assignee_employee_id,
            currentAmount: s.current_amount,
            currentCurrency: s.current_currency,
            branch: s.branch ?? null,
            assignee: s.assignee ?? null,
            priceHistoryCount: Array.isArray(s.priceHistory) ? s.priceHistory.length : 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        }))

        return res.status(200).json(result)
    }

    if (req.method === 'POST') {
        try {
            const { data: employee, error: empError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single()

            if (empError || !employee?.tenant_id) return res.status(403).json({ error: 'Tenant unassigned' })

            const body = req.body
            const { data: created, error } = await supabase
                .from('subscriptions')
                .insert({
                    tenant_id: employee.tenant_id,
                    service_name: body.serviceName,
                    service_url: body.serviceUrl || null,
                    corporate_name: body.corporateName || null,
                    billing_interval: body.billingInterval || 'monthly',
                    branch_id: body.branchId || null,
                    assignee_employee_id: body.assigneeEmployeeId || null,
                    current_currency: body.currentCurrency || 'JPY',
                })
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            return res.status(201).json({ id: created.id, ...body })
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    return res.status(405).end()
}
