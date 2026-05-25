-- ==========================================
-- 1. 点検区分 (inspection_type) を Enum で定義
-- ==========================================
CREATE TYPE inspection_type AS ENUM (
  'vehicle_inspection',         -- 車検
  'annual_inspection',          -- 12ヶ月点検
  'oil_change',                 -- オイル交換
  'tire_change_seasonal',       -- タイヤ履き替え
  'tire_replacement',           -- タイヤ新品交換
  'battery_replacement',        -- バッテリー交換
  'wiper_replacement',          -- ワイパー交換
  'brake_pad_replacement',      -- ブレーキパッド交換
  'repair',                     -- 修理
  'other'                       -- その他
);

-- ==========================================
-- 2. タイヤタイプ (tire_type) を Enum で定義
-- ==========================================
CREATE TYPE tire_type AS ENUM (
  'normal',                     -- ノーマル
  'studless'                    -- スタッドレス
);