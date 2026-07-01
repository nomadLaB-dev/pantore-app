CREATE TABLE IF NOT EXISTS attendance_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL CHECK (event_type IN ('clock_in', 'break_start', 'break_end', 'clock_out')),
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attendance_logs_employee_time ON attendance_logs (employee_id, time DESC);

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自テナントのみ" ON attendance_logs
    FOR ALL USING (tenant_id = get_auth_tenant_id());
