-- ==========================================		
-- 0. 共通トリガー関数の作成（まだ作っていない場合のみ）
-- ==========================================		
-- データの更新時に updated_at を自動で NOW() にする関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- ==========================================		
-- 1. 走行距離テーブル(vehicle_mileage)		
-- ==========================================		
CREATE TABLE IF NOT EXISTS vehicle_mileage (		
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    mileage DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定
ALTER TABLE vehicle_mileage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access temporarily"
ON vehicle_mileage AS PERMISSIVE FOR ALL TO public
USING (true) WITH CHECK (true);

-- 自動更新トリガーの適用
CREATE TRIGGER update_vehicle_mileage_updated_at
    BEFORE UPDATE ON vehicle_mileage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==========================================		
-- 2. 車両点検テーブル(vehicle_inspection)		
-- ==========================================		
CREATE TABLE IF NOT EXISTS vehicle_inspection (		
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    accidents_id TEXT REFERENCES vehicle_accidents(id) ON DELETE SET NULL,
    inspection_type inspection_type NOT NULL,
    inspection_start_date DATE NOT NULL,
    inspection_end_date DATE NOT NULL,
    inspection_cost INT NOT NULL,
    next_inspection_mileage INT,
    next_inspection_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定
ALTER TABLE vehicle_inspection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access temporarily"
ON vehicle_inspection AS PERMISSIVE FOR ALL TO public
USING (true) WITH CHECK (true);

-- 自動更新トリガーの適用
CREATE TRIGGER update_vehicle_inspection_updated_at
    BEFORE UPDATE ON vehicle_inspection
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();