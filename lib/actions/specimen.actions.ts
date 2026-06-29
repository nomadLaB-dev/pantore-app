import { createClient } from '@/lib/supabase/client'

export async function createSpecimen(data: any) {
    const res = await fetch('/api/specimens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || '検体の作成に失敗しました')
    return res.json()
}

export async function deleteAllSpecimens() {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { error } = await supabase.from('specimens').delete().neq('id', '')
    if (error) throw error

    return { success: true }
}
