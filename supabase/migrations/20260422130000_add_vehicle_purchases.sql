-- 20260422130000_add_vehicle_purchases.sql

CREATE TABLE IF NOT EXISTS vehicle_purchases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    acquisition_cost INTEGER NOT NULL,
    purchase_date DATE NOT NULL,
    first_registration_date DATE,
    body_type TEXT NOT NULL DEFAULT 'passenger_standard',
    is_new_car BOOLEAN NOT NULL DEFAULT true,
    method TEXT NOT NULL DEFAULT 'straight',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE vehicle_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の購入データだけ見れる" ON vehicle_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles 
            WHERE vehicles.id = vehicle_purchases.vehicle_id 
            AND vehicles.tenant_id = get_auth_tenant_id()
        )
    );
