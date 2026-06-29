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

export async function deleteAllUsers() {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 自分自身のアカウントは削除しない（ログイン不能になるのを防ぐため）
    const { error } = await supabase.from('users').delete().neq('user_id', user.id)
    if (error) throw error

    return { success: true }
}
