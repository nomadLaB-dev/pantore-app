# SpecimenChimera

SpecimenChimeraは、企業の資産・情報から、必要なものだけをピックアップして整理・管理できるプラットフォームを目指しています。

---

## 🚀 Concept
会社の情報はどこにまとめていますか？そもそも、本当にまとまっていますか？
私たちは、まるでパン屋さんに来た時のように、直感的に「これが必要！」「これは今はいいや」とワクワクしながら情報を取捨選択できる体験（UX）を提供します。

## 🛠 Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** Zustand
- **Database:** Supabase (Integration pending)

## 🚧 Status: Work in Progress
現在はUI/UXのプロトタイプを構築中の**モックアップフェーズ**です。
- [x] ダッシュボードの基本レイアウト
- [x] 各種アセット（車両・不動産・従業員）のモック画面
- [ ] リアルタイムデータベースとの接続
- [ ] ドラッグ＆ドロップによる「トレー操作」の実装

## 🏃‍♂️ Getting Started
まずはローカル環境で動かしてみましょう！

1. リポジトリをクローン
   ```bash
   git clone https://github.com/your-repo/pantore-app.git
   ```
2. 依存関係をインストール
   ```bash
   npm install
   ```
3. 開発サーバーを起動
   ```bash
   pnpm exec next dev
   ```

## 🔧 初回セットアップ：管理者アカウントの作成

SupabaseのAuthenticationで作成したアカウントは、それだけでは管理者（admin）になりません。  
アプリはログイン後に `public.users.specimen_role` を参照して権限を判定するため、  
**`auth.users`（認証）と `public.users`（アプリユーザー）の両方が必要**です。

### 手順

1. **Supabase Authentication でアカウントを作成**  
   Supabase Studio の `Authentication > Users` から、管理者にしたいメールアドレスでアカウントを作成する。

2. **SQL Editor で以下を実行**  
   Supabase Studio の `SQL Editor` を開き、プレースホルダー（`← 変更`の箇所）を書き換えてから実行する。

```sql
DO $$
DECLARE
  v_tenant_id   UUID;
  v_auth_id     UUID;
  v_admin_email TEXT := 'your-email@example.com'; -- ← Supabase Auth で作成したメールアドレスに変更
  v_admin_name  TEXT := '管理者';                   -- ← 表示名に変更
  v_tenant_name TEXT := '会社名';                   -- ← テナント（会社）名に変更
BEGIN
  -- 1. テナント（会社）を作成
  INSERT INTO public.tenants (name)
  VALUES (v_tenant_name)
  RETURNING id INTO v_tenant_id;

  -- 2. Supabase Auth のユーザーIDを取得
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = v_admin_email;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION
      'auth.users にメールアドレス % が見つかりません。'
      '先にSupabase Authenticationでアカウントを作成してください。',
      v_admin_email;
  END IF;

  -- 3. public.users に管理者レコードを挿入
  INSERT INTO public.users (
    id,
    tenant_id,
    user_id,
    name,
    email,
    hire_date,
    account_status,
    specimen_role
  ) VALUES (
    gen_random_uuid()::text,
    v_tenant_id,
    v_auth_id,
    v_admin_name,
    v_admin_email,
    CURRENT_DATE,
    'active',
    'admin'
  );

  RAISE NOTICE '✅ 管理者アカウントを作成しました。tenant_id: %', v_tenant_id;
END $$;
```

### 注意事項

- このSQLは**初回のみ**実行してください。再実行するとテナントが重複して作成されます。
- 2人目以降のユーザーはアプリの「オペレーター管理」または「拠点・支社管理」画面から追加してください。
- テナントが既に存在する場合は手順1のINSERT部分を省略し、`v_tenant_id` に既存のテナントIDを直接代入してください。

---

## 📝 License
This project is licensed under the MIT License.