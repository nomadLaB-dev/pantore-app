-- ==========================================		
-- 1. テナントテーブル (tenants)		
-- 以下のカラムを追加する。		
-- pref_id（都道府県ID）		
-- billing_tel（電話番号）		
-- invoice（INVOICE）		
-- parent_id（親会社ID）		
-- ==========================================		
		
ALTER TABLE tenants		
	ADD COLUMN pref_id TEXT REFERENCES prefectures(id) ON DELETE SET NULL,	
	ADD COLUMN billing_tel TEXT DEFAULT '' NOT NULL,	
	ADD COLUMN invoice TEXT,	
	ADD COLUMN parent_id uuid REFERENCES tenants(id) ON DELETE SET NULL;	
		
-- ==========================================		
-- 2. 支社テーブル (branches)		
-- 以下のカラムを追加する。		
-- pref_id（都道府県ID）		
-- tel（電話番号）		
-- invoice（INVOICE）		
-- ==========================================		
		
ALTER TABLE branches		
	ADD COLUMN pref_id TEXT REFERENCES prefectures(id) ON DELETE SET NULL,	
	ADD COLUMN tel TEXT DEFAULT '' NOT NULL,	
	ADD COLUMN invoice TEXT;	
		
-- ==========================================		
-- 3. 従業員テーブル (employees)		
-- 以下のカラムを追加する。		
-- user_name_kana（ユーザーネーム_カナ）		
-- employment_category（雇用区分）		
-- hourly_rate（時給）		
-- birthday（誕生日）		
-- address（住所）		
-- tel（電話番号）		
-- line_id（ラインID）		
-- emergency_contact（緊急連絡先）		
-- invoice（INVOICE）		
-- certification_num（認定番号）		
-- contracted_hours_per_week_min（週稼働時間_最小）		
-- contracted_hours_per_week_max（週稼働時間_最大）		
-- proficiency_rate（習熟度）		
-- ==========================================		
		
ALTER TABLE employees		
	ADD COLUMN user_name_kana TEXT DEFAULT '' NOT NULL,	
	ADD COLUMN employment_category employment_category DEFAULT 'full_time' NOT NULL,	
	ADD COLUMN hourly_rate INT,	
	ADD COLUMN birthday DATE,	
	ADD COLUMN address TEXT DEFAULT '' NOT NULL,	
	ADD COLUMN tel TEXT DEFAULT '' NOT NULL,	
	ADD COLUMN line_id TEXT,	
	ADD COLUMN emergency_contact TEXT DEFAULT '' NOT NULL,	
	ADD COLUMN invoice TEXT,	
	ADD COLUMN certification_num TEXT,	
	ADD COLUMN contracted_hours_per_week_min DECIMAL DEFAULT 0 NOT NULL,	
	ADD COLUMN contracted_hours_per_week_max DECIMAL DEFAULT 0 NOT NULL,	
	ADD COLUMN proficiency_rate DECIMAL;	