-- 20260420042830_add_insurances_accidents.sql

CREATE TABLE IF NOT EXISTS vehicle_insurances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'compulsory', 'voluntary', etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium_amount INTEGER,
    coverage_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_accidents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    accident_date DATE NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high'
    repair_cost INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE vehicle_insurances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の保険データだけ見れる" ON vehicle_insurances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE vehicles.id = vehicle_insurances.vehicle_id 
            AND vehicles.tenant_id = get_auth_tenant_id()
        )
    );

ALTER TABLE vehicle_accidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の事故データだけ見れる" ON vehicle_accidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE vehicles.id = vehicle_accidents.vehicle_id 
            AND vehicles.tenant_id = get_auth_tenant_id()
        )
    );
