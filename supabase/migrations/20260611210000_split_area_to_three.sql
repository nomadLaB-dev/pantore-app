ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS first_area  text,
    ADD COLUMN IF NOT EXISTS second_area text,
    ADD COLUMN IF NOT EXISTS third_area  text;

-- 既存データを移行
UPDATE clients SET first_area = area WHERE area IS NOT NULL AND area <> '';

ALTER TABLE clients DROP COLUMN IF EXISTS area;
