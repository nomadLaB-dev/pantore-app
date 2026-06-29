import { createClient } from '@/lib/supabase/client'

export async function createSubscription(data: any) {
    const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            serviceName: data.serviceName,
            serviceUrl: data.serviceUrl || null,
            corporateName: data.corporateName || null,
            billingInterval: data.billingInterval || 'monthly',
            branchId: data.branchId || null,
            assigneeEmployeeId: data.assigneeEmployeeId || null,
            currentCurrency: data.currency || 'JPY',
        }),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'サブスクの作成に失敗しました')
    const created = await res.json()

    if (data.amount && data.billingInterval !== 'usage') {
        await fetch(`/api/subscriptions/${created.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parseFloat(data.amount),
                currency: data.currency || 'JPY',
                effectiveFrom: data.effectiveFrom || new Date().toISOString().slice(0, 10),
                note: data.note || '',
            }),
        })
    }

    return created
}

export async function deleteAllSubscriptions() {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { error } = await supabase.from('subscriptions').delete().neq('id', '')
    if (error) throw error

    return { success: true }
}
