import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'
import { createAdminClient } from '@/lib/supabase/admin'

// createUser が「Authアカウントは既に存在する」エラーを返した場合のフォールバック。
// 過去にAuthアカウント作成後、public.users側への user_id 紐付けが何らかの理由で
// 失敗していると、孤立した（紐付いていない）Authアカウントが残ってしまうため、
// メールアドレスで既存アカウントを探し出して再利用する。
async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
    for (let page = 1; page <= 10; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
        if (error || !data) return null
        const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
        if (match) return match
        if (data.users.length < 1000) break
    }
    return null
}

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

    let authUserId: string
    if (createError || !created.user) {
        const existing = await findAuthUserByEmail(admin, user.email)
        if (!existing) return res.status(500).json({ error: createError?.message ?? 'Authアカウントの作成に失敗しました。' })

        const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
        if (updateError) return res.status(500).json({ error: updateError.message })
        authUserId = existing.id
    } else {
        authUserId = created.user.id
    }

    const { error: linkError } = await supabase
        .from('users')
        .update({ user_id: authUserId, account_status: 'active' })
        .eq('id', id)
    if (linkError) return res.status(500).json({ error: linkError.message })

    return res.status(200).json({ ok: true })
}
