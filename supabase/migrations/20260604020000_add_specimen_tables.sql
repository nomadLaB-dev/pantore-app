-- SpecimenDX 統合: 検体管理テーブル群（すべて tenant_id 付きマルチテナント対応）

-- スケジュール（集配送予定）
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uid text,
  facility_name text,
  collect_date date,
  collect_time text,
  system_type text,  -- 'M' | 'Q' | 'IP' | 'I' | 'F'
  area text,
  delivery_type text,
  base text,
  facility_code text,
  visit_place text,
  trial_name text,
  request_date date,
  request_time text,
  service text,
  con_no text,
  box_count integer,
  request text,
  courier_code text,
  courier_name text,
  reference text,
  rev text,
  note text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_tenant_isolation" ON schedules
  USING (tenant_id = get_auth_tenant_id())
  WITH CHECK (tenant_id = get_auth_tenant_id());

-- 出勤記録
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('not_started', 'working', 'on_break', 'finished')),
  time timestamptz,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_id)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records_tenant_isolation" ON attendance_records
  USING (tenant_id = get_auth_tenant_id())
  WITH CHECK (tenant_id = get_auth_tenant_id());

-- 集配施設マスタ
CREATE TABLE IF NOT EXISTS settings_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  facility text NOT NULL,
  area text,
  location_name text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_facilities_tenant_isolation" ON settings_facilities
  USING (tenant_id = get_auth_tenant_id())
  WITH CHECK (tenant_id = get_auth_tenant_id());

-- 集配エリアマスタ
CREATE TABLE IF NOT EXISTS settings_delivery_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text
);

ALTER TABLE settings_delivery_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_delivery_areas_tenant_isolation" ON settings_delivery_areas
  USING (tenant_id = get_auth_tenant_id())
  WITH CHECK (tenant_id = get_auth_tenant_id());

-- 集配業者マスタ
CREATE TABLE IF NOT EXISTS settings_couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  area text,
  name text NOT NULL,
  url text
);

ALTER TABLE settings_couriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_couriers_tenant_isolation" ON settings_couriers
  USING (tenant_id = get_auth_tenant_id())
  WITH CHECK (tenant_id = get_auth_tenant_id());

-- ユーザー設定（スケジュール列表示設定など）
CREATE TABLE IF NOT EXISTS user_preferences (
  employee_id text PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  schedule_visible_columns jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 自分の設定のみ読み書き可能（employee_id = 自分）
CREATE POLICY "user_preferences_own" ON user_preferences
  USING (employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ))
  WITH CHECK (employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ));

-- データ入力一時保存（テナントごとに1レコード）
CREATE TABLE IF NOT EXISTS data_entry_drafts (
  id text NOT NULL DEFAULT 'global',
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  state_json jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE data_entry_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_entry_drafts_tenant_isolation" ON data_entry_drafts
  USING (tenant_id = get_auth_tenant_id())
  WITH CHECK (tenant_id = get_auth_tenant_id());
