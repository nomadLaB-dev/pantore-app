-- SpecimenDX 統合: employees テーブルに specimen_role / user_code / qr_token を追加
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS specimen_role text CHECK (specimen_role IN ('admin', 'staff', 'base', 'driver')),
  ADD COLUMN IF NOT EXISTS user_code text,
  ADD COLUMN IF NOT EXISTS qr_token text;

-- user_code はテナント内でユニーク（グローバルユニーク不要）
CREATE UNIQUE INDEX IF NOT EXISTS employees_user_code_tenant_unique
  ON employees (tenant_id, user_code)
  WHERE user_code IS NOT NULL;
