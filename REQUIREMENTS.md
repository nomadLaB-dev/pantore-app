# pantore-app 要件定義（現状機能まとめ）

> 本書は現時点（2026-06-30, `feat/kikuchisan` ブランチ）でリポジトリに実装されている機能・DB構造を棚卸ししたものです。
> ※ 作業中ブランチで削除途中の機能（検体台帳・サブスクリプション・クライアント・取引先・契約 等 `specimens` / `subscriptions` / `clients` / `deals` / `contracts` 関連）は対象外とし、現存するコードのみを記載しています。

## 1. システム概要

pantore-app は、運送・検体配送事業者向けの社内業務管理システム（マルチテナント SaaS）。大きく2つの機能ドメインを持つ。

- **ERP機能**: 従業員・車両・不動産（事務所・駐車場・休憩所）などの資産管理
- **検体管理機能**: 検体配送スケジュール管理、データ入力（Gmail連携含む）、出勤管理、CIAM（集配業者の位置・稼働管理）

テナント（会社）単位でデータを分離するマルチテナント構成で、テナントは複数の支社（branches）を持つ。

## 2. 機能要件

### 2.1 認証・アカウント

- メール＋パスワードによるログイン（Supabase Auth, JWTベース）
- 新規登録（会社情報＋ユーザー情報を同時作成）
- プロフィール編集・パスワード変更（アカウント画面）
- QRコードによる従業員識別（`qr_token` 発行・再生成）

### 2.2 ダッシュボード

- ERP / 検体管理のタブ切り替え
- KPI表示: 在籍社員数、管理車両数、管理物件数、事故件数
- 不動産賃貸契約・車両保険などの期限アラート
- エリア別の人員配置・車両稼働状況の概要表示

### 2.3 従業員管理（ERP）

- 従業員一覧: 検索、ロールフィルタ、CSVインポート/エクスポート、新規作成、全件削除
- 従業員詳細: 基本情報編集、雇用履歴、勤務時間（稼働率）登録、資格管理、アカウント権限設定、パスワード変更、QRコード表示
- 雇用区分: 正社員 / パート / 契約 / 派遣
- 資格管理: IPD / Inter / FedEx / Q-dome / Mediford の各資格について、研修日・OJT(1〜3回目)・査定日・取得日・最終勤務日・有効フラグを記録
- 検体管理向けロール: admin / staff / base / driver（`specimen_role`）

### 2.4 車両管理（ERP）

- 車両一覧: 統計情報（台数・稼働状況）、フィルタ、CSVインポート/エクスポート、新規作成・編集・削除（全件削除含む）
- 車両詳細: 基本情報、リース情報、購入情報、保険情報、事故履歴、点検・整備履歴、走行距離履歴
- タイヤ種別（ノーマル/スタッドレス）、運輸支局申請状況の管理
- 点検種別: 車検 / 法定点検 / オイル交換 / 季節タイヤ交換 / タイヤ交換 / バッテリー交換 / ワイパー交換 / ブレーキパッド交換 / 修理 / その他
- 事故記録: 対人/対物の有無、修理費用、重大度（low/medium/high）

### 2.5 不動産管理（ERP）

- 不動産一覧・詳細: 物件の基本情報、用途区分（事務所/営業所/倉庫/駐車場/その他）、賃貸契約、休憩所、駐車場の管理
- 所有形態（自社所有/賃貸）、営業所登録状況（未申請/申請不要/申請済）の管理
- 賃貸契約の期限アラート（`alert_days_before` で事前通知日数を設定）

### 2.6 設定（管理者）

- テナント情報の編集（会社名、請求先情報、インボイス番号など）
- 支社の一覧・追加・編集
- 資産データエクスポート（ERPデータ出力）
- 検体管理マスタ設定: 集配施設・集配エリア・集配業者の管理

### 2.7 スケジュール管理（検体管理）

- スケジュール一覧: システム種別（M/Q/IP/I/F = Mediford/Q-dome/IPD/Inter/FedEx）フィルタ、検索、表示列のカスタマイズ（ドラッグ並び替え・列マージ・列フィルタ・ソート）
- 進捗管理: 集荷済み / 車載済み / 荷降済み / 配達済みの4段階チェック
- 添付ファイル（Supabase Storage `schedule-attachments` バケット）
- アーカイブ機能（`is_archived` フラグ、アーカイブ一覧画面）
- 集配業者別の詳細スケジュール表示
- エリア別スケジュール表示（エリアタブ切り替え）
- ユーザーごとの表示列設定の保存（`user_preferences`）

### 2.8 データ入力（検体管理）

- MDF / Q-dome / IPD / Inter / FedEx のマルチタブ入力表（スプレッドシート形式）
- セル編集、コピー&ペースト、Undo/Redo
- Gmail連携による自動データ取得（OAuth認証、メール本文からの集配データ抽出）
- 一時保存（ドラフト）と本保存

### 2.9 出勤管理（検体管理）

- ドライバー・拠点スタッフの出勤状況管理: 未出勤 / 勤務中 / 休憩中 / 退勤済
- 検索・エリアフィルタ

### 2.10 CIAM（集配業者位置・稼働管理）

- 地図上でのドライバー位置表示（MapBox）
- ドライバー一覧とステータス表示

## 3. 画面一覧

| パス | 機能 |
|---|---|
| `/` | ランディングページ（サービス紹介、ログイン/登録リンク） |
| `/login` | ログイン |
| `/login/[id]` | ログイン関連（招待等） |
| `/register` | 新規登録（会社・ユーザー情報） |
| `/dashboard` | ダッシュボード（ERP/検体管理タブ） |
| `/account` | プロフィール・パスワード変更 |
| `/settings` | テナント・支社・検体管理マスタ設定、資産データエクスポート |
| `/users` | 従業員一覧 |
| `/users/[id]` | 従業員詳細 |
| `/vehicles` | 車両一覧 |
| `/vehicles/[id]` | 車両詳細 |
| `/real-estates` | 不動産一覧・詳細 |
| `/schedules` | スケジュール一覧 |
| `/schedules/archive` | アーカイブ済みスケジュール一覧 |
| `/schedules/courier/[id]` | 集配業者別スケジュール詳細 |
| `/area-schedule` | エリア別スケジュール一覧 |
| `/data-entry` | データ入力（スプレッドシート形式・Gmail連携） |
| `/attendance` | 出勤管理 |
| `/ciam` | 集配業者位置・稼働管理（マップ） |

## 4. APIエンドポイント一覧

| エンドポイント | メソッド | 機能 |
|---|---|---|
| `/api/auth/login` | POST | ログイン |
| `/api/auth/logout` | POST | ログアウト |
| `/api/auth/me` | GET | ログイン中ユーザー情報取得 |
| `/api/branches` | GET / POST | 支社一覧取得 / 新規作成 |
| `/api/branches/[id]` | PUT / DELETE | 支社編集 / 削除 |
| `/api/dashboard/staff-allocation` | GET | エリア別人員配置情報取得 |
| `/api/gmail/auth` | GET | Gmail OAuth認証開始 |
| `/api/gmail/callback` | GET | Gmail OAuth認証コールバック |
| `/api/gmail/fetch` | GET | Gmailからメール内容取得（Inter/FedEx集配データ抽出） |
| `/api/real-estates` | GET / POST | 不動産一覧取得 / 新規作成 |
| `/api/tenants` | GET | テナント一覧取得 |
| `/api/users` | GET / POST | 従業員一覧取得（退職者含否） / 新規作成 |
| `/api/users/[id]` | GET / PUT | 従業員詳細取得 / 編集 |
| `/api/users/[id]/employment-history` | GET / POST | 雇用履歴取得 / 作成 |
| `/api/users/[id]/password` | POST | パスワード設定 |
| `/api/users/[id]/qualifications` | GET / POST | 資格情報取得 / 作成・編集 |
| `/api/users/[id]/workloads` | GET / POST | 勤務時間・稼働率取得 / 登録 |
| `/api/vehicles` | GET | 車両一覧取得 |

## 5. テーブル構造

### 5.1 ENUM型一覧

| ENUM名 | 値 |
|---|---|
| `employment_category` | full_time, part_time, contract, dispatch |
| `qualification` | ipd, inter, fedex, q_dome, mediford |
| `qualification_status` | none, training, qualified |
| `inspection_type` | vehicle_inspection, annual_inspection, oil_change, tire_change_seasonal, tire_replacement, battery_replacement, wiper_replacement, brake_pad_replacement, repair, other |
| `tire_type` | normal, studless |
| `real_estate_ownership_type` | owned, leased |
| `office_registration_status` | not_applied, not_required, applied |
| `usage_type` | office, commercial_office, warehouse, parking_lot, other |

### 5.2 テナント・組織

**tenants**（テナント）
| カラム | 型 | 制約 |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| name | TEXT | NOT NULL |
| billing_name / billing_email / billing_address / billing_tel | TEXT | billing_tel default '' |
| pref_id | TEXT | FK → prefectures(id) |
| invoice | TEXT | |
| parent_id | UUID | FK → tenants(id)（親会社） |
| created_at | TIMESTAMPTZ | default now() |

**branches**（支社）
| カラム | 型 | 制約 |
|---|---|---|
| id | TEXT | PK |
| tenant_id | UUID | FK → tenants(id) |
| name / address | TEXT | NOT NULL |
| pref_id | TEXT | FK → prefectures(id) |
| tel | TEXT | default '' |
| invoice | TEXT | |
| created_at | TIMESTAMPTZ | default now() |

**areas**（エリア） / **prefectures**（都道府県）
- areas: id(TEXT PK), name, display_order, created_at
- prefectures: id(TEXT PK), area_id(FK→areas), name, created_at

### 5.3 従業員（users、旧 employees）

| カラム | 型 | 制約 |
|---|---|---|
| id | TEXT | PK |
| tenant_id | UUID | FK → tenants(id) |
| user_id | UUID | FK → auth.users(id) |
| last_name / first_name / name | TEXT | name NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| user_name_kana | TEXT | default '' |
| hire_date | DATE | NOT NULL |
| leave_date / birthday | DATE | |
| account_status | TEXT | default 'active' |
| branch_id | TEXT | FK → branches(id) |
| employment_category | employment_category | default 'full_time' |
| hourly_rate | INT | |
| address / tel / emergency_contact | TEXT | default '' |
| line_id / invoice / certification_num | TEXT | |
| contracted_hours_per_week_min/max | DECIMAL | default 0 |
| proficiency_rate | DECIMAL | |
| specimen_role | TEXT | admin / staff / base / driver |
| user_code | TEXT | tenant_id+user_code でユニーク |
| qr_token | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | default now() |

**employee_qualifications**（資格）
| カラム | 型 | 制約 |
|---|---|---|
| employee_id | TEXT | PK, FK → users(id) |
| qualification | qualification | PK |
| qualification_status | qualification_status | NOT NULL |
| acquired_date / last_work_date / training_date | DATE | |
| ojt_1st_date / ojt_2nd_date / ojt_3rd_date / assessment_date | DATE | |
| is_active | BOOL | NOT NULL |
| update_at | TIMESTAMPTZ | トリガー自動更新 |
| created_at | TIMESTAMPTZ | default now() |

### 5.4 車両管理

**vehicles**（車両）
| カラム | 型 | 制約 |
|---|---|---|
| id | TEXT | PK |
| tenant_id | UUID | FK → tenants(id) |
| branch_id | TEXT | FK → branches(id) |
| manufacturer / model | TEXT | NOT NULL |
| license_plate / license_plate_color | TEXT | |
| ownership_type | TEXT | default 'owned' |
| tire_type | tire_type | default 'normal' |
| is_transport_bureau_applied | BOOLEAN | default false |
| created_at / updated_at | TIMESTAMPTZ | default now() |

- **vehicle_leases**: vehicle_id(UNIQUE FK), lease_company, contract_start_date, contract_end_date, monthly_fee
- **vehicle_purchases**: vehicle_id(UNIQUE FK), acquisition_cost, purchase_date, first_registration_date, body_type, is_new_car, method
- **vehicle_insurances**: vehicle_id(FK), company_name, type, start_date, end_date, premium_amount, coverage_details
- **vehicle_accidents**: vehicle_id(FK), accident_date, description, severity(low/medium/high), repair_cost, is_bodily_injury, is_property_damage
- **vehicle_mileage**: vehicle_id(FK), record_date, mileage
- **vehicle_inspection**: vehicle_id(FK), accidents_id(FK→vehicle_accidents), inspection_type, inspection_start_date, inspection_end_date, inspection_cost, next_inspection_mileage, next_inspection_date, notes

### 5.5 不動産管理

**real_estates**
| カラム | 型 | 制約 |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) |
| branches_id | TEXT | FK → branches(id) |
| name / address | TEXT | NOT NULL |
| ownership_type | real_estate_ownership_type | default 'leased' |
| office_registration_status | office_registration_status | default 'not_applied' |
| created_at / updated_at | TIMESTAMPTZ | default now() |

- **real_estate_usages**: real_estate_id(FK), usage_type(ENUM), floor_area
- **real_estate_contracts**: real_estate_id(UNIQUE FK), landlord, monthly_rent, start_date, end_date, alert_days_before(default 90)
- **real_estates_rest_facilities**（休憩所）: real_estate_id(FK), is_attached_to_office, address, landlord, monthly_rent, start_date, end_date
- **real_estates_garages**（駐車場）: real_estate_id(FK), is_attached_to_office, address, landlord, monthly_rent, capacity, start_date, end_date

ビュー: `usage_type_values`, `office_registration_status_values`（各ENUM値の参照用）

### 5.6 検体管理

**schedules**（集配送予定）
- id(UUID PK), tenant_id(FK), uid, facility_name, collect_date, collect_time
- system_type（M/Q/IP/I/F）, area, delivery_type, base, facility_code, visit_place
- trial_name, request_date, request_time, service, con_no, box_count, request
- courier_code, courier_name, reference, rev, note
- is_archived(BOOLEAN default false)
- attachment_path, attachment_name（Supabase Storage `schedule-attachments`）
- 進捗フラグ: pickup_done, vehicle_loaded, unloaded, delivered（全てBOOLEAN default false）
- created_at

**attendance_records**（出勤記録）
- id(UUID PK), tenant_id(FK), employee_id(FK→users), status(not_started/working/on_break/finished), time, last_updated
- UNIQUE(tenant_id, employee_id)

**settings_facilities / settings_delivery_areas / settings_couriers**（検体管理マスタ）
- 各 tenant_id(FK) を持ち、施設名/エリア名/業者名と関連情報を保持

**user_preferences**（ユーザー表示設定）
- employee_id(PK, FK→users), schedule_visible_columns(JSONB), updated_at

**data_entry_drafts**（データ入力ドラフト）
- id(default 'global', PK), tenant_id(PK, FK), state_json(JSONB), updated_at

## 6. 認証・マルチテナント構成

- **認証方式**: Supabase Auth（JWTベース）。`/api/auth/login`, `/logout`, `/me` で制御
- **マルチテナント分離**: 全テーブルに `tenant_id` を保持し、RLSの `get_auth_tenant_id()` 関数（`employees`／`users` テーブルから `auth.uid()` に対応する tenant_id を取得するSECURITY DEFINER関数）でテナント間アクセスを制御
- **RLS**: 全テーブルで有効化
- **Gmail OAuth連携**: `/api/gmail/auth` → `/api/gmail/callback` のフローでInter/FedExメールデータを取得

## 7. ストレージ

- Supabase Storage バケット `schedule-attachments`: スケジュール添付ファイル保存用。認証済みユーザーに INSERT/SELECT/UPDATE/DELETE を許可するRLSポリシーを設定
