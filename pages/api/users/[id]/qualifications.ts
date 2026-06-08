import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res)
    const id = req.query.id as string

    if (req.method === 'GET') {
        try {
            const { data: qualifications, error } = await supabase
                .from('employee_qualifications')
                .select('*')
                .eq('employee_id', id)
                .order('created_at', { ascending: false })

            if (error) return res.status(500).json({ error: error.message })

            const result = qualifications.map((q: any) => ({
                employeeId: q.employee_id,
                qualification: q.qualification,
                qualificationStatus: q.qualification_status,
                acquiredDate: q.acquired_date,
                lastWorkDate: q.last_work_date,
                isActive: q.is_active,
                createdAt: q.created_at,
                trainingDate: q.training_date,
                ojt1stDate: q.ojt_1st_date,
                ojt2ndDate: q.ojt_2nd_date,
                ojt3rdDate: q.ojt_3rd_date,
                assessmentDate: q.assessment_date,
            }))

            return res.status(200).json(result)
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    if (req.method === 'POST') {
        try {
            const body = req.body
            const { qualification, qualificationStatus, acquiredDate, lastWorkDate, isActive,
                    trainingDate, ojt1stDate, ojt2ndDate, ojt3rdDate, assessmentDate } = body

            const { data: existing } = await supabase
                .from('employee_qualifications')
                .select('qualification')
                .eq('employee_id', id)
                .eq('qualification', qualification)
                .maybeSingle()

            if (existing) return res.status(400).json({ error: 'この資格は既に登録されています。' })

            const { data: inserted, error: insertError } = await supabase
                .from('employee_qualifications')
                .insert({
                    employee_id: id, qualification, qualification_status: qualificationStatus,
                    acquired_date: acquiredDate || null, last_work_date: lastWorkDate || null,
                    is_active: isActive, created_at: new Date().toISOString(),
                    training_date: trainingDate || null, ojt_1st_date: ojt1stDate || null,
                    ojt_2nd_date: ojt2ndDate || null, ojt_3rd_date: ojt3rdDate || null,
                    assessment_date: assessmentDate || null,
                })
                .select()
                .single()

            if (insertError) return res.status(500).json({ error: insertError.message })
            return res.status(200).json(inserted)
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    if (req.method === 'PUT') {
        try {
            const body = req.body
            const { qualification, qualificationStatus, acquiredDate, lastWorkDate, isActive,
                    trainingDate, ojt1stDate, ojt2ndDate, ojt3rdDate, assessmentDate } = body

            const { data: updated, error: updateError } = await supabase
                .from('employee_qualifications')
                .update({
                    qualification_status: qualificationStatus,
                    acquired_date: acquiredDate || null, last_work_date: lastWorkDate || null,
                    is_active: isActive, training_date: trainingDate || null,
                    ojt_1st_date: ojt1stDate || null, ojt_2nd_date: ojt2ndDate || null,
                    ojt_3rd_date: ojt3rdDate || null, assessment_date: assessmentDate || null,
                })
                .eq('employee_id', id)
                .eq('qualification', qualification)
                .select()
                .single()

            if (updateError) return res.status(500).json({ error: updateError.message })
            return res.status(200).json(updated)
        } catch (e: any) {
            return res.status(500).json({ error: e.message })
        }
    }

    return res.status(405).end()
}
