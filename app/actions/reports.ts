'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export type CostReportRow = {
    company: string; // This effectively acts as Branch
    dept: string;
    assetCount: number;
    cost: number;
};

export type IncidentReportData = {
    count: number;
    requests: {
        id: string;
        date: string;
        userName: string;
        userDept: string;
        detail: string;
        status: string;
    }[];
};

export type AssetDetailRow = {
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
    returnDate?: string;
};

export type DashboardKpi = {
    totalAssets: number;
    utilizationRate: number;
    incidents: number;
    mttr: string; // Mean Time To Repair
    costMonth: number;
    costDiff: number; // Difference from previous month
};

export async function fetchDashboardKpiAction(
    year: number,
    month: number,
    tenantId: string
): Promise<DashboardKpi> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // --- Calculations for KPIs ---

    // 1. Total Assets
    const { count: totalAssets, error: totalAssetsError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    // 2. In-Use Assets for Utilization Rate
    const { count: inUseAssets, error: inUseAssetsError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'in_use');

    // 3. Incidents for the month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();
    const { count: incidents, error: incidentsError } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('type', 'breakdown')
        .gte('date', startDate)
        .lte('date', endDate);

    if (totalAssetsError || inUseAssetsError || incidentsError) {
        console.error('Error fetching KPI data:', { totalAssetsError, inUseAssetsError, incidentsError });
        // Return a default/error state
        return {
            totalAssets: 0,
            utilizationRate: 0,
            incidents: 0,
            mttr: 'N/A',
            costMonth: 0,
            costDiff: 0,
        };
    }

    const utilizationRate =
        totalAssets && totalAssets > 0
            ? Math.round(((inUseAssets ?? 0) / totalAssets) * 100)
            : 0;

    // --- Mocked Data ---
    // MTTR, costMonth, and costDiff require more complex calculations or historical data
    // which are not available or defined. Returning mocked values for now.
    const mttr = 'N/A'; // Mocked: MTTR calculation is complex.
    const costMonth = (totalAssets ?? 0) * 1500; // Mocked: e.g., 1500 per asset
    const costDiff = costMonth * 0.1; // Mocked: e.g., 10% increase

    return {
        totalAssets: totalAssets ?? 0,
        utilizationRate,
        incidents: incidents ?? 0,
        mttr,
        costMonth,
        costDiff,
    };
}

export async function fetchReportsAction(year: number, month: number): Promise<{
    costReport: CostReportRow[];
    incidentReport: IncidentReportData;
    assetDetailList: AssetDetailRow[];
}> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const tenantId = cookieStore.get('active_tenant_id')?.value;

    if (!tenantId) {
        return {
            costReport: [],
            incidentReport: { count: 0, requests: [] },
            assetDetailList: []
        };
    }

    // 1. Fetch Assets with User info
    const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select(`
      *,
      user:users (
        name,
        company,
        department
      )
    `)
        .eq('tenant_id', tenantId);

    if (assetsError) {
        console.error('Error fetching assets for report:', assetsError);
        return {
            costReport: [],
            incidentReport: { count: 0, requests: [] },
            assetDetailList: []
        };
    }

    // 2. Calculate Cost Report & Asset Detail List
    const costMap = new Map<string, CostReportRow>();
    const assetDetails: AssetDetailRow[] = [];

    // 1.5 Fetch Employment History for these users to get accurate Company/Dept
    const userIds = Array.from(new Set(assets.map((a: any) => a.user_id).filter(Boolean)));
    const { data: historyData } = await supabase
        .from('employment_history')
        .select('user_id, company, department, branch')
        .in('user_id', userIds)
        .order('start_date', { ascending: false });

    const historyMap = new Map<string, { company?: string; dept?: string; branch?: string }>();
    if (historyData) {
        historyData.forEach((h: any) => {
            if (!historyMap.has(h.user_id)) {
                historyMap.set(h.user_id, { company: h.company, dept: h.department, branch: h.branch });
            }
        });
    }

    assets.forEach((asset: any) => {
        // Determine Branch (Company) and Dept
        const history = asset.user_id ? historyMap.get(asset.user_id) : null;
        const company = history?.branch || history?.company || asset.user?.company || '未割り当て';
        const dept = history?.dept || asset.user?.department || '未割り当て';
        const key = `${company}_${dept}`;

        // Calculate Monthly Cost using the new logic
        let monthlyCost = 0;
        if (asset.ownership === 'owned') {
            const total = asset.purchase_cost || 0;
            const months = asset.depreciation_months || 0;
            if (months > 0) {
                monthlyCost = Math.round(total / months);
            }
        } else if (asset.ownership === 'rental' || asset.ownership === 'lease') {
            monthlyCost = asset.monthly_cost || 0;
            // Check if returned before this month
            if (asset.return_date) {
                const returnDate = new Date(asset.return_date);
                // Reset time to midnight to ensure date-only comparison
                returnDate.setHours(0, 0, 0, 0);

                const reportStart = new Date(year, month - 1, 1);
                reportStart.setHours(0, 0, 0, 0);

                // If returnDate is strictly before reportStart, cost is 0.
                if (returnDate.getTime() < reportStart.getTime()) {
                    monthlyCost = 0;
                }
            }
        }

        // Update Cost Report (Aggregate by Company + Dept)
        if (!costMap.has(key)) {
            costMap.set(key, { company, dept, assetCount: 0, cost: 0 });
        }
        const entry = costMap.get(key)!;
        entry.assetCount += 1;
        entry.cost += monthlyCost;

        // Add to Asset Detail List
        assetDetails.push({
            managementId: asset.management_id || '-',
            model: asset.model || '-',
            serial: asset.serial || '-',
            ownership: asset.ownership || '-',
            status: asset.status || '-',
            userName: asset.user?.name || '-',
            company,
            dept,
            monthlyCost,
            purchaseDate: asset.purchase_date || '-',
            returnDate: asset.return_date,
        });
    });

    const costReport = Array.from(costMap.values());

    // 3. Fetch Incidents (Requests)
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select(`
      *,
      user:users (
        name,
        department
      )
    `)
        .eq('tenant_id', tenantId)
        .eq('type', 'breakdown')
        .gte('date', startDate)
        .lte('date', endDate);

    if (requestsError) {
        console.error('Error fetching incidents:', requestsError);
        return {
            costReport,
            incidentReport: { count: 0, requests: [] },
            assetDetailList: assetDetails
        };
    }

    const incidentReport: IncidentReportData = {
        count: requests.length,
        requests: requests.map((r: any) => ({
            id: r.id,
            date: r.date,
            userName: r.user?.name || 'Unknown',
            userDept: r.user?.department || 'Unknown',
            detail: r.detail || '',
            status: r.status
        }))
    };

    return {
        costReport,
        incidentReport,
        assetDetailList: assetDetails
    };
}
