import { NextResponse } from 'next/server';
import { Employee } from '@/types';

const mockEmployees: Employee[] = [
    { id: 'emp_1', name: '山田 太郎', email: 'taro.yamada@pantore.test', hireDate: new Date('2023-04-01'), leaveDate: null, createdAt: new Date('2023-04-01'), updatedAt: new Date('2023-04-01') },
    { id: 'emp_2', name: '佐藤 花子', email: 'hanako.sato@pantore.test', hireDate: new Date('2021-10-15'), leaveDate: null, createdAt: new Date('2021-10-15'), updatedAt: new Date('2021-10-15') },
    { id: 'emp_3', name: '鈴木 一郎', email: 'ichiro.suzuki@pantore.test', hireDate: new Date('2024-01-10'), leaveDate: null, createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10') },
    { id: 'emp_4', name: '高橋 健太', email: 'kenta.takahashi@pantore.test', hireDate: new Date('2022-06-01'), leaveDate: new Date('2025-12-31'), createdAt: new Date('2022-06-01'), updatedAt: new Date('2025-01-01') },
];

export async function GET() {
    return NextResponse.json(mockEmployees);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newEmployee: Employee = {
            ...body,
            id: `emp_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return NextResponse.json(newEmployee, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
