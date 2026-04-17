import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (email && password) {
            const supabase = await createClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Login error:", error.message);
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // フロントエンドの互換性のため古いcookieもセット
            const cookieStore = await cookies();
            cookieStore.set('pantore_session', 'supabase-auth-active', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/'
            });

            return NextResponse.json({
                id: data.user.id,
                email: data.user.email,
                passwordHash: '',
                role: 'admin',
                createdAt: data.user.created_at,
            });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
