import { NextResponse } from 'next/server';
import { Employee } from '@/types';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    const employee: Employee = {
        id: resolvedParams.id,
        name: '山田 太郎',
        email: 'taro.yamada@pantore.test',
        hireDate: new Date('2023-04-01'),
        leaveDate: null,
        createdAt: new Date('2023-04-01'),
        updatedAt: new Date('2023-04-01'),
    };

    return NextResponse.json(employee);
}
