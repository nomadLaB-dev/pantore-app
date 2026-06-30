ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS delivery_areas text[] NOT NULL DEFAULT '{}';

ALTER TABLE branches
    ADD CONSTRAINT branches_delivery_areas_max5
    CHECK (array_length(delivery_areas, 1) IS NULL OR array_length(delivery_areas, 1) <= 5);
