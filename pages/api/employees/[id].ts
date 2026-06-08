import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

function mapEmployee(employee: any) {
    return {
        id: employee.id,
        name: employee.name,
        name_kana: employee.user_name_kana,
        lastName: employee.last_name,
        firstName: employee.first_name,
        email: employee.email,
        tel: employee.tel,
        lineId: employee.line_id,
        address: employee.address,
        emergencyContact: employee.emergency_contact,
        birthDate: employee.birthday,
        companyId: employee.tenant_id,
        tenant: employee.tenant,
        hireDate: employee.hire_date,
        leaveDate: employee.leave_date,
        accountStatus: employee.account_status,
        branchId: employee.branch_id,
        branch: employee.branch,
        currentEmploymentCategory: employee.employment_category,
        currentSalary: employee.hourly_rate ?? null,
        currentSalaryType: employee.hourly_rate ? 'hourly' : null,
        weeklyHoursMin: employee.contracted_hours_per_week_min,
        weeklyHoursMax: employee.contracted_hours_per_week_max,
        certificationNum: employee.certification_num,
        invoiceNum: employee.invoice,
        currentContractEnd: null,
        currentRenewalPlanned: false,
        currentPrimaryBranch: employee.branch,
        currentAssignmentNote: null,
        proficiencyRate: employee.proficiency_rate,
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)
    const id = req.query.id as string

    if (req.method === 'GET') {
        try {
            const { data: employee, error } = await supabase
                .from('employees')
                .select(`*, branch:branches(*), tenant:tenants(*)`)
                .eq('id', id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') return res.status(404).json({ error: 'Employee not found' })
                return res.status(500).json({ error: error.message })
            }

            return res.status(200).json(mapEmployee(employee))
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    if (req.method === 'PUT') {
        try {
            const body = req.body
            const updateData: any = {}
            if (body.accountStatus !== undefined) updateData.account_status = body.accountStatus
            if (body.name !== undefined) {
                updateData.name = body.name
                const parts = body.name.trim().split(/[\s　]+/)
                updateData.last_name = parts[0] || ''
                updateData.first_name = parts.slice(1).join(' ') || ''
            }
            if (body.name_kana !== undefined) updateData.user_name_kana = body.name_kana
            if (body.birthDate !== undefined) updateData.birthday = body.birthDate || null
            if (body.companyId !== undefined) updateData.tenant_id = body.companyId
            if (body.branchId !== undefined) updateData.branch_id = body.branchId || null
            if (body.email !== undefined) updateData.email = body.email
            if (body.tel !== undefined) updateData.tel = body.tel
            if (body.address !== undefined) updateData.address = body.address || ''
            if (body.emergencyContact !== undefined) updateData.emergency_contact = body.emergencyContact || ''
            if (body.hireDate !== undefined) updateData.hire_date = body.hireDate
            if (body.leaveDate !== undefined) updateData.leave_date = body.leaveDate || null
            if (body.category !== undefined) updateData.employment_category = body.category
            if (body.hourlyRate !== undefined) updateData.hourly_rate = body.hourlyRate ? Number(body.hourlyRate) : null
            if (body.weeklyHoursMin !== undefined) updateData.contracted_hours_per_week_min = body.weeklyHoursMin ? Number(body.weeklyHoursMin) : 0
            if (body.weeklyHoursMax !== undefined) updateData.contracted_hours_per_week_max = body.weeklyHoursMax ? Number(body.weeklyHoursMax) : 0
            if (body.invoiceNum !== undefined) updateData.invoice = body.invoiceNum || null
            if (body.certificationNum !== undefined) updateData.certification_num = body.certificationNum || null
            if (body.lineId !== undefined) updateData.line_id = body.lineId || null
            if (body.proficiencyRate !== undefined) updateData.proficiency_rate = body.proficiencyRate ? Number(body.proficiencyRate) : null

            const { data: employee, error } = await supabase
                .from('employees')
                .update(updateData)
                .eq('id', id)
                .select(`*, branch:branches(*), tenant:tenants(*)`)
                .single()

            if (error) return res.status(500).json({ error: error.message })
            return res.status(200).json(mapEmployee(employee))
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    return res.status(405).end()
}
