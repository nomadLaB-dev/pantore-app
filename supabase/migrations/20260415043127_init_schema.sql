-- ==========================================
-- 0. テナント管理 (一番最初に定義する！)
-- ==========================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    billing_name TEXT,
    billing_email TEXT,
    billing_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 1. 支社テーブル (Branch)
-- ==========================================
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. 雇用区分 (EmploymentCategory) を Enum で定義
-- ==========================================
CREATE TYPE employment_category AS ENUM ('full_time', 'part_time', 'contract', 'dispatch');

-- ==========================================
-- 3. 従業員テーブル (Employee)
-- ==========================================
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_name TEXT,
    first_name TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    leave_date DATE,
    account_status TEXT NOT NULL DEFAULT 'active',
    branch_id TEXT REFERENCES branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. Row Level Security (RLS) の設定
-- ==========================================
-- 無限ループ(infinite recursion)を防ぐため、テナントID取得用の
-- セキュリティ定義者(SECURITY DEFINER)関数を作成します。
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の社員データだけ見れる" ON employees
    FOR ALL USING (tenant_id = get_auth_tenant_id());

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の支社だけ見れる" ON branches
    FOR ALL USING (tenant_id = get_auth_tenant_id());