CREATE TABLE IF NOT EXISTS clients (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category        text NOT NULL DEFAULT 'other',
    company_name    text NOT NULL,
    area            text,
    department      text,
    contact_name    text,
    contact_email   text,
    contact_phone   text,
    billing_name    text,
    billing_email   text,
    billing_address text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select" ON clients
    FOR SELECT TO authenticated
    USING (tenant_id = (
        SELECT tenant_id FROM users WHERE user_id = auth.uid() LIMIT 1
    ));

CREATE POLICY "clients_insert" ON clients
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (
        SELECT tenant_id FROM users WHERE user_id = auth.uid() LIMIT 1
    ));

CREATE POLICY "clients_update" ON clients
    FOR UPDATE TO authenticated
    USING (tenant_id = (
        SELECT tenant_id FROM users WHERE user_id = auth.uid() LIMIT 1
    ));

CREATE POLICY "clients_delete" ON clients
    FOR DELETE TO authenticated
    USING (tenant_id = (
        SELECT tenant_id FROM users WHERE user_id = auth.uid() LIMIT 1
    ));
