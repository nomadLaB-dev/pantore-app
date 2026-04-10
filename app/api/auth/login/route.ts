import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (email && password) {
            const cookieStore = await cookies();
            cookieStore.set('pantore_session', 'mock-session-token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/'
            });

            return NextResponse.json({
                id: 'usr_mock_123',
                email: email,
                passwordHash: '',
                role: 'admin',
                createdAt: new Date(),
            });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
