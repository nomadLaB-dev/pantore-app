-- サブスク管理テーブル

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    service_url TEXT,
    corporate_name TEXT,
    billing_interval TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'annual' | 'usage' | 'one_time'
    branch_id TEXT REFERENCES branches(id),
    assignee_employee_id TEXT REFERENCES users(id),
    current_amount NUMERIC,
    current_currency TEXT NOT NULL DEFAULT 'JPY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社のサブスクだけ見れる" ON subscriptions
    FOR ALL USING (tenant_id = get_auth_tenant_id());

-- 価格履歴テーブル
CREATE TABLE IF NOT EXISTS subscription_price_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subscription_id TEXT REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'JPY',
    effective_from DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscription_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社のサブスク価格履歴だけ見れる" ON subscription_price_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM subscriptions
            WHERE subscriptions.id = subscription_price_history.subscription_id
            AND subscriptions.tenant_id = get_auth_tenant_id()
        )
    );
