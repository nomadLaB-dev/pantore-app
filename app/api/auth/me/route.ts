import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get('pantore_session');

    if (session) {
        return NextResponse.json({
            id: 'usr_mock_123',
            email: 'admin@pantore.test',
            passwordHash: '',
            role: 'admin',
            createdAt: new Date(),
        });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
