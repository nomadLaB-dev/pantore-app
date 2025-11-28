import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
    const email = 'yoshito.s.0717@gmail.com'
    const password = 'password123' // Default password
    const name = '貞末 麗斗'

    console.log(`Creating user: ${email}...`)

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
    })

    if (authError) {
        console.error('Error creating auth user:', authError.message)
        return
    }

    console.log('Auth user created:', authUser.user.id)

    // 2. Create Public User Profile (Trigger should handle this, but let's update the role)
    // The trigger `on_auth_user_created` inserts into public.users with role 'user'.
    // We need to upgrade this user to 'admin'.

    // Wait a bit for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', authUser.user.id)

    if (updateError) {
        console.error('Error updating user role:', updateError.message)
    } else {
        console.log('User role updated to admin')
    }
}

createAdminUser()
