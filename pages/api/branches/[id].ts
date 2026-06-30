import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)
    const id = req.query.id as string

    if (req.method === 'PUT') {
        try {
            const body = req.body
            const update: Record<string, any> = { name: body.name, address: body.address }
            if (body.deliveryAreas !== undefined) {
                const areas = Array.isArray(body.deliveryAreas) ? body.deliveryAreas.slice(0, 5) : []
                update.delivery_areas = areas
            }
            const { data, error } = await supabase
                .from('branches')
                .update(update)
                .eq('id', id)
                .select('*')
                .single()

            if (error) throw error
            return res.status(200).json(data)
        } catch (err: any) {
            return res.status(500).json({ error: err.message })
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase.from('branches').delete().eq('id', id)
            if (error) {
                if (error.code === '23503') {
                    return res.status(409).json({ error: 'この支社・拠点には車両・社員・サブスクなどのデータが紐づいているため削除できません。先に異動または削除してください。' })
                }
                throw error
            }
            return res.status(200).json({ success: true })
        } catch (err: any) {
            return res.status(500).json({ error: err.message })
        }
    }

    return res.status(405).end()
}
