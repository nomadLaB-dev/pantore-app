// ==========================================
// Type Definitions (将来のSupabaseの型定義に対応)
// ==========================================

export type Role = 'admin' | 'manager' | 'user';

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'repair' | 'disposed';

export type RequestType = 'new_hire' | 'breakdown' | 'return';

export type RequestStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export type UserStatus = 'active' | 'inactive';

// 所有形態の定義
export type OwnershipType = 'owned' | 'rental' | 'lease' | 'byod';

export const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
  owned: '自社保有 (購入)',
  rental: 'レンタル',
  lease: 'リース',
  byod: 'BYOD (私物)',
};

// 付属品リストの定義
export const ASSET_ACCESSORIES = [
  '充電アダプタ',
  '電源ケーブル',
  'マウス',
  'マウスパッド',
  'HDMIケーブル',
  '変換アダプタ',
  '外箱',
  '保証書',
  'キーボード',
  'ケース/バッグ'
];

// 🆕 マスタデータの型定義
export interface MasterData {
  companies: string[];
  departments: string[];
  branches: string[];
}

// 組織設定
export interface OrganizationSettings {
  id: string;
  name: string;
  allowedOwnerships: OwnershipType[];
  contactLabel: string;
  contactValue: string;
}

// 資産（PC）データ型
export interface Asset {
  id: string;
  managementId: string;
  serial: string;
  model: string;
  userId: string | null;
  userName: string | null;
  status: AssetStatus;
  
  ownership: OwnershipType;
  purchaseDate: string;
  
  contractEndDate?: string;
  purchaseCost?: number;
  monthlyCost?: number;
  months?: number;
  
  accessories?: string[];
  note?: string;
}

// ユーザー一覧用データ型
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string;
  dept: string;
  deviceCount: number;
  status: UserStatus;
  avatar?: string;
}

// 所属履歴型
export interface EmploymentHistory {
  id: number;
  startDate: string;
  endDate: string | null;
  company: string;
  dept: string;
  branch: string;
  position: string;
}

// デバイス利用履歴型
export interface DeviceHistory {
  model: string;
  serial: string;
  assignedAt: string;
  returnedAt?: string;
}

// ユーザー詳細データ型
export interface UserDetail extends UserSummary {
  currentDevice: DeviceHistory | null;
  history: EmploymentHistory[];
}

// 申請データ型
export interface Request {
  id: string;
  type: RequestType;
  userId: string;
  userName: string;
  userDept: string;
  date: string;
  status: RequestStatus;
  detail: string;
  note?: string;
  adminNote?: string;
}

// KPIデータ型
export interface KPIData {
  totalAssets: number;
  utilizationRate: number;
  incidents: number;
  mttr: number;
  costMonth: number;
  costDiff: number;
}

// ==========================================
// Mock Data (demo data)
// ==========================================

// 🆕 会社・部署マスタ（可変にするため const オブジェクトの中身を操作します）
export const MOCK_MASTER_DATA: MasterData = {
  companies: ['親会社HD', '子会社テック', '関連会社デザイン'],
  departments: ['開発部', '営業部', '人事部', '総務部', 'マーケティング部', 'デザイン部', '情シス', 'インフラ部'],
  branches: ['本社', '大阪支社', '福岡オフィス', 'リモート']
};

// 組織設定モック
export let MOCK_SETTINGS: OrganizationSettings = {
  id: 'ORG001',
  name: '親会社HD',
  allowedOwnerships: ['owned', 'rental', 'lease'],
  contactLabel: '情シス内線',
  contactValue: '9999',
};

// デフォルトユーザー
export const CURRENT_USER = {
  id: 'U000',
  name: '貞末 麗斗',
  email: 'yoshito.s.0717@gmail.com',
  role: 'admin' as Role,
  company: '親会社HD',
  dept: '情シス',
  avatar: 'RL',
  deviceCount: 1,
  status: 'active' as UserStatus
};

// ユーザーリスト
let MOCK_USERS_LIST: UserSummary[] = [
  { id: 'U000', name: '貞末 麗斗', email: 'yoshito.s.0717@gmail.com', role: 'admin', company: '親会社HD', dept: '情シス', deviceCount: 0, status: 'active', avatar: 'RL' },
  { id: 'U001', name: '佐藤 花子', email: 'hanako.sato@tech-sol.co.jp', role: 'manager', company: '子会社テック', dept: '営業部', deviceCount: 0, status: 'active', avatar: 'HS' },
  { id: 'U002', name: '伊集院 健児', email: 'kenji.ijuin@parent-corp.jp', role: 'user', company: '親会社HD', dept: 'デザイン部', deviceCount: 0, status: 'active', avatar: 'KI' },
  { id: 'U003', name: '新人 太郎', email: 'taro.shinjin@tech-sol.co.jp', role: 'user', company: '子会社テック', dept: '開発部', deviceCount: 0, status: 'active', avatar: 'ST' },
  { id: 'U004', name: '鈴木 一郎', email: 'ichiro.suzuki@parent-corp.jp', role: 'user', company: '親会社HD', dept: '総務部', deviceCount: 0, status: 'inactive', avatar: 'IS' },
  { id: 'U005', name: '田中 健太', email: 'kenta.tanaka@tech-sol.co.jp', role: 'user', company: '子会社テック', dept: '開発部', deviceCount: 0, status: 'active', avatar: 'KT' },
  { id: 'U006', name: '中村 美咲', email: 'misaki.nakamura@parent-corp.jp', role: 'user', company: '親会社HD', dept: 'デザイン部', deviceCount: 0, status: 'active', avatar: 'MN' },
  { id: 'U007', name: '小林 誠', email: 'makoto.kobayashi@tech-sol.co.jp', role: 'manager', company: '子会社テック', dept: '営業部', deviceCount: 0, status: 'active', avatar: 'MK' },
  { id: 'U008', name: '加藤 あゆみ', email: 'ayumi.kato@parent-corp.jp', role: 'user', company: '親会社HD', dept: '人事部', deviceCount: 0, status: 'active', avatar: 'AK' },
  { id: 'U009', name: '吉田 渉', email: 'wataru.yoshida@tech-sol.co.jp', role: 'user', company: '子会社テック', dept: '開発部', deviceCount: 0, status: 'active', avatar: 'WY' },
  { id: 'U010', name: '伊藤 沙織', email: 'saori.ito@parent-corp.jp', role: 'user', company: '親会社HD', dept: 'マーケティング部', deviceCount: 0, status: 'active', avatar: 'SI' },
  { id: 'U011', name: '渡辺 拓也', email: 'takuya.watanabe@tech-sol.co.jp', role: 'user', company: '子会社テック', dept: 'インフラ部', deviceCount: 0, status: 'active', avatar: 'WT' },
];

// 資産データ
export let MOCK_ASSETS: Asset[] = [
  { 
    id: 'A001', managementId: 'PC-24-001', serial: 'C02X12345', model: 'MacBook Pro 14 (M3)', 
    userId: 'U000', userName: '貞末 麗斗', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2024-04-01', monthlyCost: 15000, contractEndDate: '2026-03-31',
    accessories: ['充電アダプタ', '電源ケーブル', '外箱']
  },
  { 
    id: 'A002', managementId: 'PC-23-055', serial: 'DELL-9999', model: 'Dell Latitude 5420', 
    userId: null, userName: '-', status: 'available', 
    ownership: 'lease', purchaseDate: '2023-01-15', monthlyCost: 8000, months: 48, contractEndDate: '2027-01-14',
    accessories: ['充電アダプタ', 'マウス'],
    note: 'マウスのホイール反応悪し。予備機として保管。'
  },
  { 
    id: 'A003', managementId: 'PC-23-089', serial: 'C02Y67890', model: 'MacBook Air M2', 
    userId: 'U001', userName: '佐藤 花子', status: 'maintenance', 
    ownership: 'rental', purchaseDate: '2023-06-20', monthlyCost: 12000 
  },
  { 
    id: 'A004', managementId: 'OWN-22-010', serial: 'HP-8888', model: 'HP EliteBook', 
    userId: 'U002', userName: '伊集院 健児', status: 'in_use', 
    ownership: 'byod', purchaseDate: '2022-11-01', 
    note: '個人所有端末許可済み。付属品管理対象外。'
  },
  { 
    id: 'A005', managementId: 'PC-23-112', serial: 'C02Z11111', model: 'MacBook Pro 16 (M2)', 
    userId: 'U002', userName: '伊集院 健児', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2023-09-10', monthlyCost: 18000 
  },
  { 
    id: 'A006', managementId: 'PC-24-015', serial: 'DELL-A1B2', model: 'Dell XPS 13', 
    userId: 'U005', userName: '田中 健太', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2024-05-20', monthlyCost: 13000 
  },
  { 
    id: 'A007', managementId: 'PC-24-016', serial: 'LENOVO-C3D4', model: 'ThinkPad X1 Carbon', 
    userId: 'U007', userName: '小林 誠', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2024-05-21', monthlyCost: 14000 
  },
  { 
    id: 'A008', managementId: 'PC-23-150', serial: 'MS-E5F6', model: 'Surface Laptop 5', 
    userId: 'U006', userName: '中村 美咲', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2023-11-30', monthlyCost: 13500 
  },
  { 
    id: 'A009', managementId: 'PC-24-021', serial: 'C02A98765', model: 'MacBook Pro 16 (M3)', 
    userId: null, userName: '-', status: 'available', 
    ownership: 'owned', purchaseDate: '2024-06-01', purchaseCost: 350000 
  },
  { 
    id: 'A010', managementId: 'OWN-23-040', serial: 'DELL-G7H8', model: 'Dell Vostro 15', 
    userId: 'U009', userName: '吉田 渉', status: 'in_use', 
    ownership: 'owned', purchaseDate: '2023-08-15', purchaseCost: 120000 
  },
  { 
    id: 'A011', managementId: 'PC-24-033', serial: 'C02B54321', model: 'MacBook Air M3', 
    userId: 'U010', userName: '伊藤 沙織', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2024-07-01', monthlyCost: 14000 
  },
  { 
    id: 'A012', managementId: 'PC-23-180', serial: 'LENOVO-I9J0', model: 'ThinkPad T14', 
    userId: 'U011', userName: '渡辺 拓也', status: 'in_use', 
    ownership: 'rental', purchaseDate: '2023-12-20', monthlyCost: 11000 
  },
];

// デバイスカウント計算
const deviceCounts = MOCK_ASSETS.reduce((acc, asset) => {
  if (asset.userId) {
    acc[asset.userId] = (acc[asset.userId] || 0) + 1;
  }
  return acc;
}, {} as Record<string, number>);

MOCK_USERS_LIST = MOCK_USERS_LIST.map(user => ({
  ...user,
  deviceCount: deviceCounts[user.id] || 0,
}));

const adminUser = MOCK_USERS_LIST.find(u => u.id === CURRENT_USER.id);
if (adminUser) {
  CURRENT_USER.deviceCount = adminUser.deviceCount;
}

export const MOCK_USER_DETAIL_DATA: UserDetail = {
  ...MOCK_USERS_LIST[0], 
  currentDevice: { 
    model: 'MacBook Pro 14 (M3 Max)', 
    serial: 'C02X_ADMIN_01', 
    assignedAt: '2024-04-01' 
  },
  history: [
    { id: 1, startDate: '2024-04-01', endDate: null, company: '親会社HD', dept: '情シス', branch: '本社', position: 'リーダー' },
    { id: 2, startDate: '2022-04-01', endDate: '2024-03-31', company: '子会社テック', dept: '開発部', branch: '大阪', position: 'エンジニア' },
  ]
};

export const MOCK_KPI_DATA: KPIData = {
  totalAssets: 150,
  utilizationRate: 92,
  incidents: 3,
  mttr: 1.5,
  costMonth: 1200000,
  costDiff: 50000,
};

export const MOCK_REQUESTS: Request[] = [
  { id: 'R001', type: 'new_hire', userId: 'U003', userName: '新人 太郎', userDept: '開発部', date: '2025-11-18', status: 'pending', detail: '開発用MacBook希望 (メモリ32GB以上)', note: '入社予定日: 12/01' },
  { id: 'R002', type: 'breakdown', userId: 'U001', userName: '佐藤 花子', userDept: '営業部', date: '2025-11-17', status: 'approved', detail: '画面ひび割れ', note: '代替機発送済み' },
  { id: 'R003', type: 'return', userId: 'U004', userName: '鈴木 一郎', userDept: '総務部', date: '2025-11-15', status: 'completed', detail: '退職に伴う返却', note: '返却キット送付済' },
];

// export MOCK_USERS_LIST to be mutable
export { MOCK_USERS_LIST };