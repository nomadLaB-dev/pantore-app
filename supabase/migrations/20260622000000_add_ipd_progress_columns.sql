-- IPD タブ再編に伴う進捗チェック項目（集荷・車載・荷降・配達）

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS pickup_done boolean NOT NULL DEFAULT false;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS vehicle_loaded boolean NOT NULL DEFAULT false;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS unloaded boolean NOT NULL DEFAULT false;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS delivered boolean NOT NULL DEFAULT false;
