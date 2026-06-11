ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS areas text[] NOT NULL DEFAULT '{}';

-- 既存データを移行
UPDATE clients
SET areas = ARRAY_REMOVE(
    ARRAY[first_area, second_area, third_area],
    NULL
)
WHERE first_area IS NOT NULL;

ALTER TABLE clients
    DROP COLUMN IF EXISTS first_area,
    DROP COLUMN IF EXISTS second_area,
    DROP COLUMN IF EXISTS third_area;
