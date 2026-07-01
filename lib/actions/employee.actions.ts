import { createClient } from '@/lib/supabase/client'

export async function createEmployee(data: any) {
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || '社員の作成に失敗しました')
    return res.json()
}

export async function deleteEmployee(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
    return { success: true }
}

export async function deleteAllUsers() {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // user_id が未設定（ログインアカウントを持たないドライバー等）の行は
    // neq('user_id', ...) だとNULL比較で常に除外されてしまうため、
    // 自分自身の社員レコードIDで除外する
    const { data: me, error: meError } = await supabase.from('users').select('id').eq('user_id', user.id).single()
    if (meError) throw meError

    const { error } = await supabase.from('users').delete().neq('id', me.id)
    if (error) throw error

    return { success: true }
}
