-- 20260420032830_add_vehicles.sql

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES branches(id),
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    license_plate TEXT,
    license_plate_color TEXT,
    ownership_type TEXT NOT NULL DEFAULT 'owned', -- 'owned' or 'leased'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lease info table (optional but good for structure)
CREATE TABLE IF NOT EXISTS vehicle_leases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    lease_company TEXT NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    monthly_fee INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の車両データだけ見れる" ON vehicles
    FOR ALL USING (tenant_id = get_auth_tenant_id());

ALTER TABLE vehicle_leases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社のリースデータだけ見れる" ON vehicle_leases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE vehicles.id = vehicle_leases.vehicle_id 
            AND vehicles.tenant_id = get_auth_tenant_id()
        )
    );
