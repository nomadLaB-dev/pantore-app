-- ==========================================
-- 車両テーブル (vehicles)
-- 以下のカラムを追加し、デフォルト値を false に設定する
-- is_transport_bureau_applied(運輸支局申請状況)
-- ==========================================

ALTER TABLE vehicles
	ADD COLUMN is_transport_bureau_applied BOOLEAN NOT NULL DEFAULT false;