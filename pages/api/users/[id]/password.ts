import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()

    const id = req.query.id as string
    const { password } = req.body

    if (!password || String(password).length < 8) {
        return res.status(400).json({ error: 'パスワードは8文字以上で入力してください。' })
    }

    const supabase = createClient(req, res)
    const { data: user, error } = await supabase.from('users').select('id, email, user_id').eq('id', id).single()
    if (error || !user) return res.status(404).json({ error: 'ユーザーが見つかりません。' })

    const admin = createAdminClient()

    if (user.user_id) {
        const { error: authError } = await admin.auth.admin.updateUserById(user.user_id, { password })
        if (authError) return res.status(500).json({ error: authError.message })
        return res.status(200).json({ ok: true })
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
    })
    if (createError || !created.user) return res.status(500).json({ error: createError?.message ?? 'Authアカウントの作成に失敗しました。' })

    const { error: linkError } = await supabase
        .from('users')
        .update({ user_id: created.user.id, account_status: 'active' })
        .eq('id', id)
    if (linkError) return res.status(500).json({ error: linkError.message })

    return res.status(200).json({ ok: true })
}
