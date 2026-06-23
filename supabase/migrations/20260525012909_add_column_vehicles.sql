-- ==========================================
-- 車両テーブル (vehicles)
-- 以下のカラムを追加し、デフォルト値を 'normal' に設定する
-- ==========================================

ALTER TABLE vehicles
	ADD COLUMN tire_type tire_type NOT NULL DEFAULT 'normal';