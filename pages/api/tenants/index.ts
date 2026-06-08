import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const supabase = createClient(req, res)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

        if (req.method === 'GET') {
            const all = req.query.all === 'true'

            if (all) {
                const { data: tenants, error } = await supabase
                    .from('tenants')
                    .select('*')
                    .order('name', { ascending: true })
                if (error) throw error
                return res.status(200).json(tenants)
            }

            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single()

            if (empError || !employee?.tenant_id) return res.status(403).json({ error: 'Tenant unassigned' })

            const { data: tenant, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', employee.tenant_id)
                .single()

            if (error) throw error
            return res.status(200).json(tenant)
        }

        if (req.method === 'PUT') {
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single()

            if (empError || !employee?.tenant_id) return res.status(403).json({ error: 'Tenant unassigned' })

            const body = req.body
            const { data, error } = await supabase
                .from('tenants')
                .update({
                    name: body.name,
                    billing_name: body.billingName,
                    billing_email: body.billingEmail,
                    billing_address: body.billingAddress,
                })
                .eq('id', employee.tenant_id)
                .select()
                .single()

            if (error) throw error
            return res.status(200).json(data)
        }

        return res.status(405).end()
    } catch (e: any) {
        return res.status(500).json({ error: e.message })
    }
}
