import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();

        const cookieStore = await cookies();
        cookieStore.delete('pantore_session');

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
