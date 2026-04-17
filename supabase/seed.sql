-- ==========================================
-- 1. テナント (会社) の登録
-- ==========================================
-- 開発用にUUIDを固定（全て0の末尾1）にしておくと、他テーブルとの紐付けが楽です。
INSERT INTO public.tenants (id, name)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'シューペルブリアン株式会社')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. 支社の登録
-- ==========================================
-- idはわかりやすい文字列にしておきます。
INSERT INTO public.branches (id, tenant_id, name, address)
VALUES 
    ('branch_hiroshima', '00000000-0000-0000-0000-000000000001', '広島本社', '広島県広島市...'),
    ('branch_fukuoka',   '00000000-0000-0000-0000-000000000001', 'ケア福岡', '福岡県福岡市...'),
    ('branch_kumamoto',  '00000000-0000-0000-0000-000000000001', 'ケア熊本', '熊本県熊本市...'),
    ('branch_tokyo',     '00000000-0000-0000-0000-000000000001', 'ワーク東京', '東京都...')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. テストユーザー (auth.users) の登録
-- ==========================================
-- ログイン用のテストユーザーを作成します (パスワード: password123)
-- auth.usersへのINSERTには、publicにあるpgcrypto拡張関数のcryptを使用しています
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

-- ==========================================
-- 4. 従業員 (employees) の登録
-- ==========================================
-- テストユーザーをテナントと紐付けます
INSERT INTO public.employees (
    id,
    tenant_id,
    user_id,
    last_name,
    first_name,
    name,
    email,
    hire_date,
    account_status,
    branch_id
)
VALUES (
    'emp_001',
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '山田',
    '太郎',
    '山田 太郎',
    'test@example.com',
    '2024-04-01',
    'active',
    'branch_hiroshima'
)
ON CONFLICT (id) DO NOTHING;