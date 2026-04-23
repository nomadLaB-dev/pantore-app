CREATE TYPE real_estate_ownership_type AS ENUM ('owned', 'leased');

CREATE TABLE real_estates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    ownership_type real_estate_ownership_type NOT NULL DEFAULT 'leased',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE real_estates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view real_estates of their tenant"
    ON real_estates FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Users can insert real_estates of their tenant"
    ON real_estates FOR INSERT
    WITH CHECK (tenant_id = get_auth_tenant_id());

CREATE POLICY "Users can update real_estates of their tenant"
    ON real_estates FOR UPDATE
    USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Users can delete real_estates of their tenant"
    ON real_estates FOR DELETE
    USING (tenant_id = get_auth_tenant_id());

CREATE TABLE real_estate_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    real_estate_id UUID NOT NULL REFERENCES real_estates(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL,
    floor_area NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE real_estate_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view real_estate_usages of their tenant"
    ON real_estate_usages FOR SELECT
    USING (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE POLICY "Users can insert real_estate_usages of their tenant"
    ON real_estate_usages FOR INSERT
    WITH CHECK (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE POLICY "Users can update real_estate_usages of their tenant"
    ON real_estate_usages FOR UPDATE
    USING (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE POLICY "Users can delete real_estate_usages of their tenant"
    ON real_estate_usages FOR DELETE
    USING (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE TABLE real_estate_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    real_estate_id UUID NOT NULL REFERENCES real_estates(id) ON DELETE CASCADE,
    landlord TEXT NOT NULL,
    monthly_rent INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_days_before INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT real_estate_contracts_real_estate_id_key UNIQUE (real_estate_id)
);

ALTER TABLE real_estate_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view real_estate_contracts of their tenant"
    ON real_estate_contracts FOR SELECT
    USING (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE POLICY "Users can insert real_estate_contracts of their tenant"
    ON real_estate_contracts FOR INSERT
    WITH CHECK (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE POLICY "Users can update real_estate_contracts of their tenant"
    ON real_estate_contracts FOR UPDATE
    USING (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));

CREATE POLICY "Users can delete real_estate_contracts of their tenant"
    ON real_estate_contracts FOR DELETE
    USING (real_estate_id IN (SELECT id FROM real_estates WHERE tenant_id = get_auth_tenant_id()));


