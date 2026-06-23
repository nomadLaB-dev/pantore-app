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

    const { data: rest, error: restErr } = await supabase.from('real_estates_rest_facilities').select('*');
    console.log("Rest Facilities query:", { rest, restErr });

    const { data: garage, error: garageErr } = await supabase.from('real_estates_garages').select('*');
    console.log("Garages query:", { garage, garageErr });

    const { data: usageTypes, error: usageTypesErr } = await supabase.from('usage_type_values').select('*');
    console.log("Usage Types View query:", { usageTypes, usageTypesErr });

    const { data: regStatuses, error: regStatusesErr } = await supabase.from('office_registration_status_values').select('*');
    console.log("Registration Statuses View query:", { regStatuses, regStatusesErr });
}
test();
