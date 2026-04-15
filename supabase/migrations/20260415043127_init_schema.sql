-- 1. 支社テーブル (Branch)
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 雇用区分 (EmploymentCategory) を Enum で定義
CREATE TYPE employment_category AS ENUM ('full_time', 'part_time', 'contract', 'dispatch');

-- 3. 従業員テーブル (Employee)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    last_name TEXT,
    first_name TEXT,
    name TEXT NOT NULL, -- 表示用フルネーム
    email TEXT UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    leave_date DATE,
    account_status TEXT NOT NULL DEFAULT 'active', -- AccountStatus型
    branch_id TEXT REFERENCES branches(id), -- どの支社に所属しているか
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);