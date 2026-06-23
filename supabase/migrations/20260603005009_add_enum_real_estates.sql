-- ==========================================
-- 不動産関係のENUMを作成する
-- ==========================================

-- ==========================================
-- 1. 不動産申請ステータス (office_registration_status) を Enum で定義
-- ==========================================
CREATE TYPE office_registration_status AS ENUM (
  'not_applied',         -- 未申請
  'not_required',        -- 申請不要
  'applied'              -- 申請済み
);

-- ===========================================
-- 2. 不動産用途区分 (usage_type) を Enum で定義
-- ===========================================
CREATE TYPE usage_type AS ENUM (
  'office',              -- 事務所
  'commercial_office',   -- オフィス
  'warehouse',           -- 倉庫
  'parking_lot',         -- 駐車場
  'other'                -- その他
);
