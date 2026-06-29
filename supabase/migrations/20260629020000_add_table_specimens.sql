-- 検体管理テーブル（血液・尿・組織などの検体受付・追跡）

CREATE TABLE IF NOT EXISTS specimens (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    specimen_type TEXT NOT NULL,
    collect_date DATE,
    status TEXT NOT NULL DEFAULT '受付済', -- '受付済' | '集荷待ち' | '検査中' | '完了'
    priority BOOLEAN NOT NULL DEFAULT false,
    clinic TEXT,
    doctor TEXT,
    notes TEXT,
    timeline JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE specimens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会社の検体だけ見れる" ON specimens
    FOR ALL USING (tenant_id = get_auth_tenant_id());
