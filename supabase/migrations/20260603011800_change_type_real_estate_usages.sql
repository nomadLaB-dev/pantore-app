-- ==========================================
-- 1.不動産用途テーブル（real_estate_usages）のタイプを変更する
-- 元々、textタイプだったものを先に宣言したENUMタイプに置き換える
-- ==========================================

ALTER TABLE real_estate_usages
  ALTER COLUMN usage_type TYPE usage_type USING usage_type::usage_type;