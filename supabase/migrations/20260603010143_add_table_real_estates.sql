-- ==========================================
-- 不動産関連テーブルを作成する
-- ==========================================

-- データの更新時に updated_at を自動で現在時刻にする関数（まだ作成していない場合のみ定義）
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- ==========================================
-- 1. 休憩所テーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS real_estates_rest_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    real_estate_id UUID NOT NULL REFERENCES real_estates(id) ON DELETE CASCADE,
    is_attached_to_office BOOLEAN NOT NULL DEFAULT TRUE,
    address TEXT,
    monthly_rent INTEGER,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

-- 休憩所テーブル用の自動更新トリガー
CREATE TRIGGER update_real_estates_rest_facilities_updated_at
    BEFORE UPDATE ON real_estates_rest_facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- ==========================================
-- 2. 駐車場テーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS real_estates_garages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    real_estate_id UUID NOT NULL REFERENCES real_estates(id) ON DELETE CASCADE,
    is_attached_to_office BOOLEAN NOT NULL DEFAULT TRUE,
    address TEXT,
    monthly_rent INTEGER,
    start_date DATE,
    end_date DATE,
    capacity INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 駐車場テーブル用の自動更新トリガー
CREATE TRIGGER update_real_estates_garages_updated_at
    BEFORE UPDATE ON real_estates_garages
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();