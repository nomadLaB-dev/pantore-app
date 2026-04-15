import { NextResponse } from 'next/server';
import { mockEmploymentHistory } from '@/lib/mocks/employees';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const history = mockEmploymentHistory
        .filter((h) => h.employeeId === id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return NextResponse.json(history);
}
