import type { NextApiRequest, NextApiResponse } from 'next'
import type { EmploymentTypeHistory } from '@/types'

// 雇用・配置履歴を保持する専用テーブルは未実装のため、データソースが追加されるまでは空配列を返す。
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()
    const history: EmploymentTypeHistory[] = []
    return res.status(200).json(history)
}
