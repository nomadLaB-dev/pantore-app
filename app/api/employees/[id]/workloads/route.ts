import { NextResponse } from 'next/server';
import { WorkloadHistory } from '@/types';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    const workloads: WorkloadHistory[] = [
        { id: 'wl_1', employeeId: resolvedParams.id, workload: 1.0, startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31') },
        { id: 'wl_2', employeeId: resolvedParams.id, workload: 0.8, startDate: new Date('2024-04-01'), endDate: null },
    ];

    return NextResponse.json(workloads);
}
