# SpecimenDX 未実装機能リスト

## ページ（routes）— 未実装のもの

| パス | 機能名 |
|---|---|
| /attendance | 勤怠管理 |
| /attendance | 勤怠管理 |

> 実装済み: /login, /schedules, /schedules/archive, /data-entry, /dashboard, /users, /settings（管理設定・マスタ管理含む）
> 不要: /ciam

---

## 機能レベルの未実装

### 認証
- ログイン処理（現状は localStorage に app_role を直接セットする仮実装）
- Supabase users テーブルを使った実認証（user_id / password_str 照合）
- QRコードログイン（users.qr_token カラムは定義済みだが処理なし）
- セッション管理・ログアウト後のトークン無効化

### 勤怠管理
- ドライバーの出勤・退勤打刻
- attendance_records テーブルへの書き込み・一覧表示
- 打刻履歴のエクスポート

### ロールベースアクセス制御（RBAC）
- Sidebar.tsx のメニュー絞り込みロジックはあるが、ページ側での認可チェックなし（URLを直打ちすればアクセス可能）
