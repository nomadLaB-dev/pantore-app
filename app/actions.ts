'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { Request, CreateRequestInput, OrganizationSettings, MasterData, UserDetail, UserSummary } from '@/lib/types';

import { redirect } from 'next/navigation';

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

export async function fetchRequestsAction() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('requests')
        .select(`
            *,
            users (
                name,
                department
            )
        `)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return [];
    }

    // Map Supabase response to Request type
    return data.map((req: any) => ({
        id: req.id,
        type: req.type,
        userId: req.user_id,
        userName: req.users?.name || 'Unknown',
        userDept: req.users?.department || 'Unknown',
        date: req.date,
        status: req.status,
        detail: req.detail,
        note: req.note,
        adminNote: req.admin_note
    }));
}

export async function createRequestAction(request: CreateRequestInput) {
    const supabase = await createClient();

    // Get current user if userId is missing (though it should be passed)
    let userId = request.userId;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
    }

    const { error } = await supabase.from('requests').insert({
        type: request.type,
        user_id: userId,
        date: request.date,
        status: 'pending',
        detail: request.detail,
        note: request.note
    });

    if (error) {
        console.error('Error creating request:', error);
        throw new Error('Failed to create request');
    }

    revalidatePath('/portal');
    revalidatePath('/dashboard');
}

export async function updateRequestStatusAction(id: string, status: Request['status']) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating request status:', error);
        throw new Error('Failed to update request status');
    }

    revalidatePath('/portal');
    revalidatePath('/dashboard');
}

export async function fetchAssetsAction() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('assets')
        .select(`
            *,
            users (
                name
            )
        `)
        .order('management_id', { ascending: true });

    if (error) {
        console.error('Error fetching assets:', error);
        return [];
    }

    // Map to Asset type
    return data.map((asset: any) => ({
        id: asset.id,
        managementId: asset.management_id,
        serial: asset.serial,
        model: asset.model,
        userId: asset.user_id,
        userName: asset.users?.name || '-',
        status: asset.status,
        ownership: asset.ownership,
        purchaseDate: asset.purchase_date,
        contractEndDate: asset.contract_end_date,
        purchaseCost: asset.purchase_cost,
        monthlyCost: asset.monthly_cost,
        months: asset.ownership === 'owned' ? undefined : asset.months,
        depreciationMonths: asset.ownership === 'owned' ? asset.months : undefined,
        note: asset.note,
        accessories: asset.accessories
    }));
}

export async function fetchUsersAction() {
    const supabase = await createClient();

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('name');

    if (userError) {
        console.error('Error fetching users:', userError);
        return [];
    }

    // Fetch asset counts
    const { data: assets } = await supabase.from('assets').select('user_id');
    const deviceCounts: Record<string, number> = {};
    assets?.forEach((a: any) => {
        if (a.user_id) {
            deviceCounts[a.user_id] = (deviceCounts[a.user_id] || 0) + 1;
        }
    });

    return users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        dept: user.department,
        deviceCount: deviceCounts[user.id] || 0,
        status: user.status,
        avatar: user.avatar_url
    }));
}

export async function fetchDashboardKpiAction(year: number, month: number) {
    const supabase = await createClient();

    // Total Assets
    const { count: totalAssets } = await supabase.from('assets').select('*', { count: 'exact', head: true });

    // Utilization (Assets in_use / Total)
    const { count: inUseAssets } = await supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'in_use');

    const utilizationRate = totalAssets ? Math.round((inUseAssets || 0) / totalAssets * 100) : 0;

    // Incidents (Requests of type 'breakdown' in this month?)
    // For now, let's show "Open Incidents" (pending breakdowns)
    const { count: incidents } = await supabase.from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'breakdown')
        .eq('status', 'pending');

    // Cost (Sum of monthly_cost)
    const { data: assets } = await supabase.from('assets').select('monthly_cost');
    const costMonth = assets?.reduce((sum, a) => sum + (a.monthly_cost || 0), 0) || 0;

    // Cost Diff (Approximation: Cost of assets added this month)
    // Note: This assumes cost only increases. For real diff we need historical data.
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const { data: newAssets } = await supabase.from('assets')
        .select('monthly_cost')
        .gte('created_at', startOfMonth);

    const costDiff = newAssets?.reduce((sum, a) => sum + (a.monthly_cost || 0), 0) || 0;

    return {
        totalAssets: totalAssets || 0,
        utilizationRate,
        incidents: incidents || 0,
        mttr: 1.5, // Hardcoded for now as we don't track resolution time in db yet
        costMonth,
        costDiff
    };
}

// Settings Actions
export async function fetchSettingsAction(): Promise<OrganizationSettings | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('organization_settings').select('*').single();

    if (error) {
        console.error('Error fetching settings:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        allowedOwnerships: data.allowed_ownerships,
        contactLabel: data.contact_label,
        contactValue: data.contact_value
    };
}

export async function updateSettingsAction(settings: OrganizationSettings) {
    const supabase = await createClient();
    const { error } = await supabase.from('organization_settings').upsert({
        name: settings.name, // Assuming name is unique key
        allowed_ownerships: settings.allowedOwnerships,
        contact_label: settings.contactLabel,
        contact_value: settings.contactValue
    }, { onConflict: 'name' });

    if (error) {
        console.error('Error updating settings:', error);
        throw new Error('Failed to update settings');
    }
    revalidatePath('/dashboard/settings');
}

// Master Data Actions
export async function fetchMasterDataAction(): Promise<MasterData> {
    const supabase = await createClient();

    const { data: companies } = await supabase.from('companies').select('name');
    const { data: departments } = await supabase.from('departments').select('name');
    const { data: branches } = await supabase.from('branches').select('name');

    return {
        companies: companies?.map(c => c.name) || [],
        departments: departments?.map(d => d.name) || [],
        branches: branches?.map(b => b.name) || []
    };
}

export async function updateMasterDataAction(data: MasterData) {
    const supabase = await createClient();

    // Simple replace strategy: Delete all and insert new (Transaction would be better)
    // For now, let's just insert missing ones to avoid deleting used ones?
    // Or just assume this is a full sync.
    // Given the simple nature, let's try to just insert new ones and ignore duplicates?
    // But if user deleted one, we want it gone.
    // Deleting is risky if referenced. But they are text references.
    // Let's just implement "add new ones" for now to be safe, or maybe the UI only adds?
    // The UI in settings page likely replaces the whole list.

    // Let's try delete all and insert.
    await supabase.from('companies').delete().neq('name', 'PLACEHOLDER_TO_KEEP_IF_NEEDED');
    // Actually delete without where deletes all.
    // But we need to be careful.
    // Let's just insert for now.

    // Companies
    if (data.companies.length > 0) {
        await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        await supabase.from('companies').insert(data.companies.map(name => ({ name })));
    }

    // Departments
    if (data.departments.length > 0) {
        await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('departments').insert(data.departments.map(name => ({ name })));
    }

    // Branches
    if (data.branches.length > 0) {
        await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('branches').insert(data.branches.map(name => ({ name })));
    }

    revalidatePath('/dashboard/settings');
}

// --- Reports ---

export interface DashboardKpi {
    totalAssets: number;
    utilizationRate: number;
    incidents: number;
    mttr: number;
    costMonth: number;
    costDiff: number;
}

export interface CostReportRow {
    company: string;
    dept: string;
    cost: number;
    assetCount: number;
}

export interface IncidentReportData {
    count: number;
    requests: any[];
}

export interface AssetDetailRow {
    managementId: string;
    model: string;
    serial: string;
    ownership: string;
    status: string;
    userName: string;
    company: string;
    dept: string;
    monthlyCost: number;
    purchaseDate: string;
}

export async function fetchReportsAction(year: number, month: number) {
    const supabase = await createClient();

    // 1. Fetch Assets with User info
    const { data: assets } = await supabase
        .from('assets')
        .select(`
      *,
      user:users (
        name,
        company,
        department
      )
    `);

    // 2. Fetch Incidents (Requests)
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

    // --- Generate Cost Report ---
    const costReportMap: { [key: string]: CostReportRow } = {};

    assets?.forEach((asset: any) => {
        if (asset.status !== 'in_use' && asset.status !== 'maintenance') return;
        if (!asset.user) return;

        let cost = 0;
        if (asset.ownership === 'rental' || asset.ownership === 'lease') {
            cost = asset.monthly_cost || 0;
        }

        if (cost === 0) return;

        const key = `${asset.user.company}-${asset.user.department}`;
        if (!costReportMap[key]) {
            costReportMap[key] = {
                company: asset.user.company || '-',
                dept: asset.user.department || '-',
                cost: 0,
                assetCount: 0,
            };
        }
        costReportMap[key].cost += cost;
        costReportMap[key].assetCount += 1;
    });

    const costReport = Object.values(costReportMap).sort((a, b) => b.cost - a.cost);

    // --- Generate Incident Report ---
    const { data: requestsWithUsers } = await supabase
        .from('requests')
        .select(`
      *,
      user:users (
        name,
        department
      )
    `)
        .eq('type', 'breakdown')
        .gte('date', `${targetMonth}-01`)
        .lte('date', `${targetMonth}-31`);

    const incidentReport: IncidentReportData = {
        count: requestsWithUsers?.length || 0,
        requests: requestsWithUsers?.map(req => ({
            id: req.id,
            date: req.date,
            userName: req.user?.name || 'Unknown',
            userDept: req.user?.department || '-',
            detail: req.detail,
            status: req.status
        })) || []
    };

    // --- Generate Asset Detail List ---
    const ownershipLabels: Record<string, string> = {
        owned: '自社保有 (購入)',
        rental: 'レンタル',
        lease: 'リース',
        byod: 'BYOD (私物)',
    };

    const statusLabels: Record<string, string> = {
        in_use: '貸出中',
        available: '在庫',
        maintenance: 'メンテ中',
        repair: '修理中',
        disposed: '廃棄済',
    };

    const assetDetailList: AssetDetailRow[] = assets?.map((asset: any) => ({
        managementId: asset.management_id,
        model: asset.model,
        serial: asset.serial,
        ownership: ownershipLabels[asset.ownership] || asset.ownership,
        status: statusLabels[asset.status] || asset.status,
        userName: asset.user?.name || '未割当',
        company: asset.user?.company || '-',
        dept: asset.user?.department || '-',
        monthlyCost: asset.monthly_cost || 0,
        purchaseDate: asset.purchase_date,
    })) || [];

    return {
        costReport,
        incidentReport,
        assetDetailList
    };
}


// User Detail Action
export async function fetchCurrentUserAction(): Promise<UserDetail | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;
    return fetchUserDetailAction(user.id);
}

export async function fetchUserDetailAction(userId: string): Promise<UserDetail | null> {
    const supabase = await createClient();

    // Fetch user
    const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !user) return null;

    // Fetch device count (or assets)
    const { data: assets } = await supabase.from('assets').select('*').eq('user_id', userId);
    const deviceCount = assets?.length || 0;

    // Fetch current device (latest assigned?)
    // Logic from demo.ts: currentDevice is just one.
    // We can pick the first one from assets or logic.
    // demo.ts had `currentDevice` as `DeviceHistory`.
    // Let's map the first asset to `currentDevice` format if exists.
    let currentDevice = null;
    if (assets && assets.length > 0) {
        const asset = assets[0];
        currentDevice = {
            model: asset.model,
            serial: asset.serial,
            assignedAt: asset.created_at, // or some assigned date
            returnedAt: undefined
        };
    }

    // Fetch history
    const { data: history } = await supabase.from('employment_history').select('*').eq('user_id', userId).order('start_date', { ascending: false });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        dept: user.department,
        deviceCount,
        status: user.status,
        avatar: user.avatar_url,
        currentDevice,
        history: history?.map((h: any) => ({
            id: h.id, // uuid to number? UserDetail expects number id?
            // demo.ts: id: number.
            // We should update UserDetail type to string id or cast.
            // Let's cast to any or update type.
            // For now, let's just pass it.
            startDate: h.start_date,
            endDate: h.end_date,
            company: h.company,
            dept: h.department,
            branch: h.branch,
            position: h.position
        })) as any
    };
}

// User Actions

export async function createUserAction(user: UserSummary) {
    // Use Service Role Key for Admin actions
    const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 1. Create Auth User (Admin only)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: 'password123', // Default password
        email_confirm: true,
        user_metadata: { name: user.name }
    });

    if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(authError.message);
    }

    // 2. Update Public Profile (Trigger creates it, we update details)
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
            role: user.role,
            company: user.company,
            department: user.dept,
            status: user.status,
            avatar_url: user.avatar
        })
        .eq('id', authUser.user.id);

    if (updateError) {
        console.error('Error updating user profile:', updateError);
    }

    // 3. Create Initial Employment History
    const { error: historyError } = await supabaseAdmin
        .from('employment_history')
        .insert({
            user_id: authUser.user.id,
            start_date: new Date().toISOString().split('T')[0], // Today
            company: user.company,
            department: user.dept,
            position: '一般', // Default position
            branch: '本社' // Default branch or empty
        });

    if (historyError) {
        console.error('Error creating initial history:', historyError);
    }

    revalidatePath('/dashboard/users');
}

export async function updateUserAction(user: UserSummary) {
    const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    const { error } = await supabaseAdmin
        .from('users')
        .update({
            name: user.name,
            role: user.role,
            company: user.company,
            department: user.dept,
            status: user.status,
            avatar_url: user.avatar
        })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating user:', error);
        throw new Error('Failed to update user');
    }

    revalidatePath('/dashboard/users');
}

export async function createEmploymentHistoryAction(history: any) {
    const supabase = await createClient();

    const { error } = await supabase.from('employment_history').insert({
        user_id: history.userId,
        start_date: history.startDate,
        end_date: history.endDate,
        company: history.company,
        department: history.dept,
        branch: history.branch,
        position: history.position
    });

    if (error) {
        console.error('Error creating history:', error);
        throw new Error('Failed to create history');
    }

    // Sync with users table if this is the current active history
    // (No end date or end date is in the future)
    const isCurrent = !history.endDate || new Date(history.endDate) > new Date();
    if (isCurrent) {
        // Use admin client to bypass RLS if needed, or just standard client if user has permission
        // Since this action is likely called by admin/manager, standard client might work if RLS allows.
        // But to be safe and consistent with previous fixes, let's use the admin client for user updates.
        const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        await supabaseAdmin.from('users').update({
            company: history.company,
            department: history.dept
        }).eq('id', history.userId);
    }

    revalidatePath('/dashboard/users');
}

export async function updateAssetAction(asset: any) {
    const supabase = await createClient();

    const { error } = await supabase.from('assets').update({
        management_id: asset.managementId,
        serial: asset.serial,
        model: asset.model,
        user_id: asset.userId || null,
        status: asset.status,
        ownership: asset.ownership,
        purchase_date: asset.purchaseDate || null,
        contract_end_date: asset.contractEndDate || null,
        purchase_cost: asset.purchaseCost,
        monthly_cost: asset.monthlyCost,
        months: asset.ownership === 'owned' ? asset.depreciationMonths : asset.months,
        note: asset.note,
        accessories: asset.accessories
    }).eq('id', asset.id);

    if (error) {
        console.error('Error updating asset:', error);
        throw new Error('Failed to update asset');
    }

    revalidatePath('/dashboard/assets');
    revalidatePath('/dashboard/users');
}

export async function createAssetAction(asset: any) {
    const supabase = await createClient();

    const { error } = await supabase.from('assets').insert({
        management_id: asset.managementId,
        serial: asset.serial,
        model: asset.model,
        user_id: asset.userId || null,
        status: asset.status,
        ownership: asset.ownership,
        purchase_date: asset.purchaseDate || null,
        contract_end_date: asset.contractEndDate || null,
        purchase_cost: asset.purchaseCost,
        monthly_cost: asset.monthlyCost,
        months: asset.ownership === 'owned' ? asset.depreciationMonths : asset.months,
        note: asset.note,
        accessories: asset.accessories
    });

    if (error) {
        console.error('Error creating asset:', error);
        throw new Error(`Failed to create asset: ${error.message || JSON.stringify(error)}`);
    }

    revalidatePath('/dashboard/assets');
    revalidatePath('/dashboard/users');
}

export async function deleteAssetAction(id: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('assets').delete().eq('id', id);

    if (error) {
        console.error('Error deleting asset:', error);
        throw new Error('Failed to delete asset');
    }

    revalidatePath('/dashboard/assets');
    revalidatePath('/dashboard/users');
}
