-- ==========================================
-- 資格一覧テーブル (employee_qualifications)
-- 以下のカラムを追加する。
-- training_date（研修日）
-- 1st_ojt_date（OJT1回目）
-- 2nd_ojt_date（OJT2回目）
-- 3rd_ojt_date（OJT3回目）
-- assessment_date（見極め日）
-- update_at（更新日）
-- ==========================================

ALTER TABLE employee_qualifications
	ADD COLUMN training_date DATE,
	ADD COLUMN ojt_1st_date DATE,
	ADD COLUMN ojt_2nd_date DATE,
	ADD COLUMN ojt_3rd_date DATE,
	ADD COLUMN assessment_date DATE,
	ADD COLUMN update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
	
-- ==========================================	
-- update_atを自動更新する関数を作成	
-- ==========================================	
	
CREATE EXTENSION IF NOT EXISTS moddatetime;	
	
-- ==========================================	
-- トリガーの作成（レコード更新時にupdate_atを現在時刻にする）	
-- ==========================================	
	
CREATE TRIGGER handle_update_at BEFORE UPDATE ON employee_qualifications	
	FOR EACH ROW EXECUTE PROCEDURE moddatetime (update_at);