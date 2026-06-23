-- ==========================================		
-- 1. 休憩所テーブル (real_estates_rest_facilities)		
-- 以下のカラムを追加する。		
-- landlord（家主）
-- ==========================================		

ALTER TABLE real_estates_rest_facilities
  ADD COLUMN landlord TEXT NOT NULL DEFAULT '';

-- ==========================================		
-- 2. 駐車場テーブル (real_estates_garages)		
-- 以下のカラムを追加する。		
-- landlord（家主）
-- ==========================================		

ALTER TABLE real_estates_garages
  ADD COLUMN landlord TEXT NOT NULL DEFAULT '';