-- ==========================================		
-- 1. 不動産テーブル (real_estates)		
-- 以下のカラムを追加する。		
-- branches_id（支社ID）
-- office_registration_status（申請ステータス）
-- ==========================================		

ALTER TABLE real_estates		
  ADD COLUMN branches_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN office_registration_status office_registration_status NOT NULL DEFAULT 'not_applied';