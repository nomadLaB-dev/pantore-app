-- ==========================================
-- 車両事故テーブル (vehicle_accidents)
-- 以下のカラムを追加し、デフォルト値を false に設定する
-- is_bodily_injury(対人フラグ)
-- is_property_damage(対物フラグ)
-- ==========================================

ALTER TABLE vehicle_accidents
	ADD COLUMN is_bodily_injury BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN is_property_damage BOOLEAN NOT NULL DEFAULT false;