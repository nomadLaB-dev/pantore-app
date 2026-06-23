ALTER TABLE settings_delivery_areas
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE settings_couriers
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
