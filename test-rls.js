const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
    });
    if (authErr) {
        console.error("Auth Error:", authErr);
        return;
    }
    console.log("Logged in:", authData.user.id);

    const { data: emp, error: empErr } = await supabase.from('employees').select('*').eq('user_id', authData.user.id).single();
    console.log("Employee query:", { emp, empErr });

    const { data: ten, error: tenErr } = await supabase.from('tenants').select('*');
    console.log("Tenants query:", { ten, tenErr });

    const { data: bra, error: brErr } = await supabase.from('branches').select('*');
    console.log("Branches query:", { bra, brErr });
}
test();
