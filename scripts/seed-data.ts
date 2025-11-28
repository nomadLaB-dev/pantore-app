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

// --- Inline Data for Seeding ---

const SEED_MASTER_DATA = {
    companies: ['シューペルブリアン株式会社', '株式会社SPB-NC', '関連会社デザイン'],
    departments: ['開発部', '営業部', '人事部', '総務部', 'マーケティング部', 'デザイン部', '情シス', 'インフラ部'],
    branches: ['本社', '大阪支社', '福岡オフィス', 'リモート']
};

const SEED_USERS_LIST = [
    { id: 'U000', name: '貞末 麗斗', email: 'yoshito.s.0717@gmail.com', role: 'admin', company: '親会社HD', dept: '情シス', deviceCount: 0, status: 'active', avatar: 'RL' },
];

const SEED_ASSETS = [
    {
        id: 'A001', managementId: 'PC-24-001', serial: 'C02X12345', model: 'MacBook Pro 14 (M3)',
        userId: 'U000', userName: '貞末 麗斗', status: 'in_use',
        ownership: 'rental', purchaseDate: '2024-04-01', monthlyCost: 15000, contractEndDate: '2026-03-31',
        accessories: ['充電アダプタ', '電源ケーブル', '外箱'],
        purchaseCost: null, months: 24, note: ''
    },
];

const SEED_REQUESTS: any[] = [];

async function seedData() {
    console.log('Starting data seed...')

    // 0. Cleanup Existing Data
    console.log('Cleaning up existing data...')
    const { error: reqError } = await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (reqError) console.error('Error cleaning requests:', reqError.message)

    const { error: assetError } = await supabase.from('assets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (assetError) console.error('Error cleaning assets:', assetError.message)

    const { error: histError } = await supabase.from('employment_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (histError) console.error('Error cleaning history:', histError.message)

    // Note: We don't delete users here to avoid deleting the admin if they already exist and we want to preserve them,
    // or because deleting auth users is slower. But to be thorough, we should probably clean up non-admin users or all users.
    // For now, let's assume we keep users but maybe we should clean up master data.

    const { error: compError } = await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (compError) console.error('Error cleaning companies:', compError.message)

    const { error: deptError } = await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (deptError) console.error('Error cleaning departments:', deptError.message)

    const { error: branchError } = await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (branchError) console.error('Error cleaning branches:', branchError.message)

    // 1. Seed Master Data (Companies, Departments)
    console.log('Seeding Master Data...')

    // Companies
    for (const company of SEED_MASTER_DATA.companies) {
        const { error } = await supabase.from('companies').insert({ name: company })
        if (error) console.error(`Error inserting company ${company}:`, error.message)
    }

    // Departments
    for (const dept of SEED_MASTER_DATA.departments) {
        const { error } = await supabase.from('departments').insert({ name: dept })
        if (error) console.error(`Error inserting department ${dept}:`, error.message)
    }

    // Branches
    for (const branch of SEED_MASTER_DATA.branches) {
        const { error } = await supabase.from('branches').insert({ name: branch })
        if (error) console.error(`Error inserting branch ${branch}:`, error.message)
    }

    // 2. Seed Users
    console.log('Seeding Users...')
    for (const user of SEED_USERS_LIST) {
        // Skip if user already exists (e.g. admin created previously)
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const exists = existingUser.users.some(u => u.email === user.email)

        if (exists) {
            console.log(`User ${user.email} already exists, skipping auth creation.`)
            continue;
        }

        // Create Auth User
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: 'password123', // Default password
            email_confirm: true,
            user_metadata: { name: user.name }
        })

        if (authError) {
            console.error(`Error creating auth user ${user.email}:`, authError.message)
            continue
        }

        // Update Public Profile
        // The trigger creates the row, but we need to update other fields like company, dept, role
        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 500))

        const { error: updateError } = await supabase
            .from('users')
            .update({
                role: user.role,
                company: user.company,
                department: user.dept,
                avatar_url: user.avatar
            })
            .eq('id', authUser.user.id)

        if (updateError) {
            console.error(`Error updating profile for ${user.email}:`, updateError.message)
        }
    }

    // 3. Seed Assets
    // We need to map the "U000" IDs from mock data to actual UUIDs in Supabase.
    console.log('Seeding Assets...')

    // Fetch all users to create a map
    const { data: allUsers } = await supabase.from('users').select('id, email')
    const userMap = new Map<string, string>() // Email -> UUID
    if (allUsers) {
        allUsers.forEach(u => {
            if (u.email) userMap.set(u.email, u.id)
        })
    }

    // Helper to find UUID by mock ID
    const getUuidByMockId = (mockId: string | null) => {
        if (!mockId) return null;
        const mockUser = SEED_USERS_LIST.find(u => u.id === mockId);
        if (!mockUser) return null;
        return userMap.get(mockUser.email) || null;
    }

    for (const asset of SEED_ASSETS) {
        const userId = getUuidByMockId(asset.userId);

        const { error } = await supabase.from('assets').insert({
            management_id: asset.managementId,
            serial: asset.serial,
            model: asset.model,
            user_id: userId,
            status: asset.status,
            ownership: asset.ownership,
            purchase_date: asset.purchaseDate,
            contract_end_date: asset.contractEndDate,
            purchase_cost: asset.purchaseCost,
            monthly_cost: asset.monthlyCost,
            months: asset.months,
            note: asset.note,
            accessories: asset.accessories
        })

        if (error) console.error(`Error inserting asset ${asset.managementId}:`, error.message)
    }

    // 4. Seed Requests
    console.log('Seeding Requests...')
    for (const req of SEED_REQUESTS) {
        const userId = getUuidByMockId(req.userId);

        if (!userId) {
            console.warn(`Skipping request ${req.id} because user not found`)
            continue
        }

        const { error } = await supabase.from('requests').insert({
            type: req.type,
            user_id: userId,
            date: req.date,
            status: req.status,
            detail: req.detail,
            note: req.note,
            // admin_note: req.adminNote
        })

        if (error) console.error(`Error inserting request ${req.id}:`, error.message)
    }

    // 5. Seed Settings
    console.log('Seeding Settings...')
    const { error: settingsError } = await supabase.from('organization_settings').upsert({
        name: 'シューペルブリアンHD', // MOCK_SETTINGS.name
        allowed_ownerships: ['owned', 'rental'],
        contact_label: '情シス内線',
        contact_value: '9999'
    }, { onConflict: 'name' }) // Simple conflict resolution

    if (settingsError) console.error('Error seeding settings:', settingsError.message)

    // 6. Seed Employment History
    console.log('Seeding Employment History...')
    // MOCK_USER_DETAIL_DATA has history for the admin user (U000)
    // We'll just add this specific history for the admin user
    const adminEmail = 'yoshito.s.0717@gmail.com'
    const { data: adminUser } = await supabase.from('users').select('id').eq('email', adminEmail).single()

    if (adminUser) {
        const historyData = [
            { startDate: '2024-04-01', endDate: null, company: '親会社HD', dept: '情シス', branch: '本社', position: 'リーダー' },
            { startDate: '2022-04-01', endDate: '2024-03-31', company: '子会社テック', dept: '開発部', branch: '大阪', position: 'エンジニア' },
        ]

        for (const h of historyData) {
            const { error } = await supabase.from('employment_history').insert({
                user_id: adminUser.id,
                start_date: h.startDate,
                end_date: h.endDate,
                company: h.company,
                department: h.dept,
                branch: h.branch,
                position: h.position
            })
            if (error) console.error('Error seeding history:', error.message)
        }
    }

    console.log('Data seed completed!')
}

seedData()
