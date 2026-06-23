-- ==========================================		
-- 1. エリアテーブル (areas)		
-- ==========================================		
		
CREATE TABLE IF NOT EXISTS areas (		
	id TEXT PRIMARY KEY,	
	name TEXT NOT NULL,	
	display_order INT,	
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()	
);		
		
-- ==========================================		
-- 2. 都道府県テーブル (prefectures)		
-- ==========================================		
		
CREATE TABLE IF NOT EXISTS prefectures (		
	id TEXT PRIMARY KEY,	
	area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,	
	name TEXT NOT NULL,	
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()	
);		
		
-- ==========================================		
-- 3. 従業員資格テーブル (employee_qualifications)		
-- ==========================================		
		
CREATE TABLE IF NOT EXISTS employee_qualifications (		
	employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,	
	qualification qualification NOT NULL,	
	qualification_status qualification_status NOT NULL,	
	acquired_date DATE,	
	last_work_date DATE,	
	is_active BOOL NOT NULL,	
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()	
);		
		
-- ==========================================		
-- 【RLS】1. エリアテーブル (areas)		
-- ==========================================		
		
-- 1. RLSの有効化		
	ALTER TABLE areas ENABLE ROW LEVEL SECURITY;	
		
-- 2. すべてのユーザーに対して、すべての操作を許可するポリシーを作成		
	CREATE POLICY "Allow all access temporarily"	
	ON areas	
	AS PERMISSIVE	
	FOR ALL	
	TO public	
	USING (true)	
	WITH CHECK (true);	
		
-- ==========================================		
-- 【RLS】2. 都道府県テーブル (prefectures)		
-- ==========================================		
		
-- 1. RLSの有効化		
	ALTER TABLE prefectures ENABLE ROW LEVEL SECURITY;	
		
-- 2. すべてのユーザーに対して、すべての操作を許可するポリシーを作成		
	CREATE POLICY "Allow all access temporarily"	
	ON prefectures	
	AS PERMISSIVE	
	FOR ALL	
	TO public	
	USING (true)	
	WITH CHECK (true);	
		
-- ==========================================		
-- 【RLS】3. 従業員資格テーブル (employee_qualifications)		
-- ==========================================		
		
-- 1. RLSの有効化		
	ALTER TABLE employee_qualifications ENABLE ROW LEVEL SECURITY;	
		
-- 2. すべてのユーザーに対して、すべての操作を許可するポリシーを作成		
	CREATE POLICY "Allow all access temporarily"	
	ON employee_qualifications	
	AS PERMISSIVE	
	FOR ALL	
	TO public	
	USING (true)	
	WITH CHECK (true);	