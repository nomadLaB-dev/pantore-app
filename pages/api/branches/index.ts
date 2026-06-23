import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)

    if (req.method === 'GET') {
        try {
            const { data: branches, error } = await supabase
                .from('branches')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) return res.status(500).json({ error: 'データの取得に失敗しました' })
            return res.status(200).json(branches)
        } catch (error) {
            return res.status(500).json({ error: '予期せぬエラーが発生しました' })
        }
    }

    if (req.method === 'POST') {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

            const { data: employee, error: empError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single()

            if (empError || !employee?.tenant_id) return res.status(403).json({ error: 'Tenant not found' })

            const body = req.body
            const newBranch = {
                id: `branch_${crypto.randomUUID()}`,
                tenant_id: employee.tenant_id,
                name: body.name,
                address: body.address || '',
            }

            const { data, error } = await supabase
                .from('branches')
                .insert(newBranch)
                .select('*')
                .single()

            if (error) return res.status(500).json({ error: '支社の作成に失敗しました' })
            return res.status(200).json(data)
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }

    return res.status(405).end()
}
