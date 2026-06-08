import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)

    if (req.method === 'GET') {
        try {
            const includeArchived = req.query.includeArchived === 'true'

            let query = supabase.from('employees').select(`*, branch:branches(*)`)
            if (!includeArchived) query = query.is('leave_date', null)

            const { data: employees, error } = await query.order('created_at', { ascending: false })
            if (error) return res.status(500).json({ error: error.message })

            const result = employees.map((e: any) => ({
                id: e.id,
                name: e.name,
                lastName: e.last_name,
                firstName: e.first_name,
                email: e.email,
                hireDate: e.hire_date,
                leaveDate: e.leave_date,
                accountStatus: e.account_status,
                branchId: e.branch_id,
                branch: e.branch,
                currentEmploymentCategory: e.employment_category,
                currentSalary: e.hourly_rate ?? null,
                currentSalaryType: e.hourly_rate ? 'hourly' : null,
                currentContractEnd: null,
                currentRenewalPlanned: false,
                currentPrimaryBranch: e.branch,
                currentAssignmentNote: null,
                proficiencyRate: e.proficiency_rate,
            }))

            return res.status(200).json(result)
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    if (req.method === 'POST') {
        try {
            const body = req.body
            let lastName = ''
            let firstName = ''
            if (body.name) {
                const parts = body.name.trim().split(/[\s　]+/)
                lastName = parts[0] || ''
                firstName = parts.slice(1).join(' ') || ''
            }

            const { data, error } = await supabase
                .from('employees')
                .insert({
                    name: body.name,
                    last_name: lastName,
                    first_name: firstName,
                    user_name_kana: body.name_kana,
                    birthday: body.birthDate || null,
                    tenant_id: body.companyId,
                    branch_id: body.branchId || null,
                    email: body.email,
                    tel: body.tel,
                    address: body.address || '',
                    emergency_contact: body.emergencyContact || '',
                    hire_date: body.hireDate,
                    employment_category: body.category,
                    hourly_rate: body.hourlyRate ? Number(body.hourlyRate) : null,
                    contracted_hours_per_week_min: body.weeklyHoursMin ? Number(body.weeklyHoursMin) : 0,
                    contracted_hours_per_week_max: body.weeklyHoursMax ? Number(body.weeklyHoursMax) : 0,
                    account_status: 'none',
                    invoice: body.invoiceNum || null,
                    certification_num: body.certificationNum || null,
                    line_id: body.lineId || null,
                    proficiency_rate: body.proficiencyRate ? Number(body.proficiencyRate) : null,
                })
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            return res.status(201).json(data)
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    return res.status(405).end()
}
