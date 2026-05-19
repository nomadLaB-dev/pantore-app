-- ==========================================			
-- 1. エリア（areas）の登録			
-- ==========================================			
INSERT INTO public.areas (id, name)
VALUES
	('10', '中四国')
ON CONFLICT (id) DO NOTHING;
			
-- ==========================================			
-- 2. 都道府県（prefectures）の登録			
-- ==========================================			
INSERT INTO public.prefectures (id, area_id, name)			
VALUES			
	('1001','10', '広島'),		
	('1002','10', '岡山'),		
	('1003','10', '山陰'),		
	('1004','10', '山口'),		
	('1005','10', '愛媛'),		
	('1006','10', '香川')		
ON CONFLICT (id) DO NOTHING;			
			
-- ==========================================			
-- 3. 会社（tenants）の登録			
-- ==========================================			
INSERT INTO public.tenants (id, name, pref_id, billing_tel)			
VALUES			
	('00000000-0000-0000-0000-000000000001', 'シューペルブリアン株式会社','1001','090-0000-0000')
ON CONFLICT (id) DO NOTHING;			
			
-- ==========================================			
-- 4. 支社（branches）の登録			
-- ==========================================			
INSERT INTO public.branches (id, tenant_id, name, address, pref_id, tel)			
VALUES			
	('branch_hiroshima', '00000000-0000-0000-0000-000000000001', '広島本社', '広島県広島市','1001','090-0000-0000'),		
	('branch_matsuyama', '00000000-0000-0000-0000-000000000001', '松山事業所', '愛媛県松山市','1005','090-0000-0000'),		
	('branch_takamatsu', '00000000-0000-0000-0000-000000000001', '高松事業所', '香川県高松市','1006','090-0000-0000')
ON CONFLICT (id) DO NOTHING;			
			
-- ==========================================			
-- 5. テストユーザー（auth.users）の登録			
-- ==========================================			
INSERT INTO auth.users (			
	instance_id,		
	id,		
	aud,		
	role,		
	email,		
	encrypted_password,		
	email_confirmed_at,		
	created_at,		
	updated_at,		
	confirmation_token,		
	recovery_token,		
	email_change_token_new,		
	email_change		
)			
VALUES (			
	'00000000-0000-0000-0000-000000000000',		
	'11111111-1111-1111-1111-111111111111',		
	'authenticated',		
	'authenticated',		
	'test@example.com',		
	crypt('password123', gen_salt('bf')),		
	NOW(),		
	NOW(),		
	NOW(),		
	'',		
	'',		
	'',		
	''		
)			
ON CONFLICT (id) DO NOTHING;			
			
-- さらに auth.identities も追加 (ログインの安定性のため)			
INSERT INTO auth.identities (			
	provider_id,		
	user_id,		
	identity_data,		
	provider,		
	last_sign_in_at,		
	created_at,		
	updated_at		
)			
VALUES (			
	'11111111-1111-1111-1111-111111111111',		
	'11111111-1111-1111-1111-111111111111',		
	format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'test@example.com')::jsonb,		
	'email',		
	NOW(),		
	NOW(),		
	NOW()		
)			
ON CONFLICT (provider_id, provider) DO NOTHING;			