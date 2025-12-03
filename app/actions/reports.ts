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

    // 4. Calculate Costs (Current Month vs Previous Month)
    // We need to fetch ALL assets to calculate cost, not just count.
    // Since we already did a count query above, we might want to optimize, but for now let's fetch data.
    // Actually, let's just fetch all assets once instead of the count query if we need to iterate them.
    // But to minimize change risk, I'll add a separate fetch for now or modify the first one.
    // Let's modify the first query to fetch data instead of just count, as we need it for cost.

    const { data: allAssets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('tenant_id', tenantId);

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

    if (assetsError || incidentsError) {
        console.error('Error fetching KPI data:', { assetsError, incidentsError });
        return {
            totalAssets: 0,
            utilizationRate: 0,
            incidents: 0,
            mttr: 'N/A',
            costMonth: 0,
            costDiff: 0,
        };
    }

    const totalAssetsCount = allAssets.length;
    const inUseAssetsCount = allAssets.filter(a => a.status === 'in_use').length;

    const utilizationRate =
        totalAssetsCount > 0
            ? Math.round((inUseAssetsCount / totalAssetsCount) * 100)
            : 0;

    // Calculate Cost for Current Month
    const currentMonthCost = calculateTotalCost(allAssets, year, month);

    // Calculate Cost for Previous Month
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
    }
    const prevMonthCost = calculateTotalCost(allAssets, prevYear, prevMonth);

    const costDiff = currentMonthCost - prevMonthCost;

    // MTTR is still complex to calculate without a proper 'resolved_at' field in requests or history.
    // Keeping it as mocked/placeholder for now or 'N/A'.
    const mttr = 'N/A';

    return {
        totalAssets: totalAssetsCount,
        utilizationRate,
        incidents: incidents ?? 0,
        mttr,
        costMonth: currentMonthCost,
        costDiff,
    };
}

function calculateTotalCost(assets: any[], year: number, month: number): number {
    let totalCost = 0;
    const reportStart = new Date(year, month - 1, 1);
    reportStart.setHours(0, 0, 0, 0);

    assets.forEach(asset => {
        let monthlyCost = 0;

        // Check if asset was purchased/active before this month
        // If purchase_date is in the future relative to report month, cost is 0?
        // Usually depreciation starts from purchase date.
        if (asset.purchase_date) {
            const purchaseDate = new Date(asset.purchase_date);
            purchaseDate.setHours(0, 0, 0, 0);
            if (purchaseDate > reportStart) {
                // Asset not yet purchased in this report month
                return;
            }
        }

        if (asset.ownership === 'owned') {
            const total = asset.purchase_cost || 0;
            const months = asset.depreciation_months || 0;
            if (months > 0) {
                // Check if depreciation period is over
                // Simple logic: if (current_date - purchase_date) < months * 30 days
                // A more accurate check:
                if (asset.purchase_date) {
                    const purchaseDate = new Date(asset.purchase_date);
                    const monthsPassed = (year - purchaseDate.getFullYear()) * 12 + (month - purchaseDate.getMonth());
                    // If we are within the depreciation period (e.g. 0 to months-1, or 1 to months depending on definition)
                    // Let's assume standard straight-line depreciation starting month of purchase
                    if (monthsPassed >= 0 && monthsPassed < months) {
                        monthlyCost = Math.round(total / months);
                    }
                }
            }
        } else if (asset.ownership === 'rental' || asset.ownership === 'lease') {
            monthlyCost = asset.monthly_cost || 0;
            // Check if returned before this month
            if (asset.return_date) {
                const returnDate = new Date(asset.return_date);
                returnDate.setHours(0, 0, 0, 0);

                // If returnDate is strictly before reportStart, cost is 0.
                if (returnDate.getTime() < reportStart.getTime()) {
                    monthlyCost = 0;
                }
            }
        }
        totalCost += monthlyCost;
    });
    return totalCost;
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
