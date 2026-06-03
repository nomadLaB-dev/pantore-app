-- ==========================================
-- 1. 利用用途 (usage_type) ENUM値を返却するビューの定義
-- ==========================================
CREATE OR REPLACE VIEW public.usage_type_values AS
SELECT enumlabel::text AS value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'usage_type';

-- ==========================================
-- 2. 申請ステータス (office_registration_status) ENUM値を返却するビューの定義
-- ==========================================
CREATE OR REPLACE VIEW public.office_registration_status_values AS
SELECT enumlabel::text AS value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'office_registration_status';

-- ==========================================
-- 3. 権限付与
-- ==========================================
GRANT SELECT ON public.usage_type_values TO anon, authenticated;
GRANT SELECT ON public.office_registration_status_values TO anon, authenticated;
