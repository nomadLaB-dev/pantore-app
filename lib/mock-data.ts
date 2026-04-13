// Shared mock data for clients and deals — imported by all API routes

export const mockClients = [
    {
        id: 'cl_1', companyName: '株式会社サンライズフード', department: '食品事業部',
        contactName: '田村 誠司', contactEmail: 'tamura@sunrise-food.co.jp', contactPhone: '03-1234-5678',
        billingName: '田村 誠司', billingEmail: 'billing@sunrise-food.co.jp', billingAddress: '東京都港区南青山2-2-15',
        createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15'),
    },
    {
        id: 'cl_2', companyName: '合同会社ベーカリーデジタル', department: 'ITソリューション部',
        contactName: '松本 菜々子', contactEmail: 'matsumoto@bakery-digital.jp', contactPhone: '06-9876-5432',
        billingName: '経理部 宛', billingEmail: 'accounting@bakery-digital.jp', billingAddress: '大阪府大阪市北区梅田3-1-3',
        createdAt: new Date('2024-03-10'), updatedAt: new Date('2024-06-01'),
    },
    {
        id: 'cl_3', companyName: 'グリーンフィールド農産株式会社', department: '調達・購買部',
        contactName: '中野 拓也', contactEmail: 'nakano@greenfield-agri.jp', contactPhone: '045-111-2222',
        billingName: '中野 拓也', billingEmail: 'nakano@greenfield-agri.jp', billingAddress: '神奈川県横浜市中区本町4-44',
        createdAt: new Date('2025-01-20'), updatedAt: new Date('2025-01-20'),
    },
];

export const mockDeals = [
    {
        id: 'd_1', clientId: 'cl_1', name: '食品管理システム 導入支援',
        startDate: new Date('2024-02-01'), endDate: new Date('2024-07-31'),
        autoRenew: false, billingType: 'shot' as const, amount: 1500000, currency: 'JPY',
        status: 'completed' as const, notes: '初期導入フェーズ、定例MTX月2回', createdAt: new Date('2024-01-20'),
    },
    {
        id: 'd_2', clientId: 'cl_2', name: 'ECサイト運用保守',
        startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'),
        autoRenew: true, billingType: 'recurring' as const, amount: 120000, currency: 'JPY',
        status: 'active' as const, notes: '月額保守、SLA 99.5%', createdAt: new Date('2024-03-15'),
    },
    {
        id: 'd_3', clientId: 'cl_3', name: '農産物調達データ分析レポート',
        startDate: new Date('2025-02-01'), endDate: new Date('2025-04-30'),
        autoRenew: false, billingType: 'shot' as const, amount: 480000, currency: 'JPY',
        status: 'active' as const, notes: '四半期ごとのデータ納品', createdAt: new Date('2025-01-25'),
    },
];

export const mockDealAssignees = [
    { id: 'da_1', dealId: 'd_1', assigneeName: '山田 太郎', assigneeEmail: 'taro.yamada@pantore.test', assignedAt: new Date('2024-01-20'), handoverNote: null },
    { id: 'da_2', dealId: 'd_1', assigneeName: '佐藤 花子', assigneeEmail: 'hanako.sato@pantore.test', assignedAt: new Date('2024-05-01'), handoverNote: '山田の産休取得につき引き継ぎ。先方担当は田村様、月2回のMTGが必須。' },
    { id: 'da_3', dealId: 'd_2', assigneeName: '佐藤 花子', assigneeEmail: 'hanako.sato@pantore.test', assignedAt: new Date('2024-04-01'), handoverNote: null },
    { id: 'da_4', dealId: 'd_3', assigneeName: '山田 太郎', assigneeEmail: 'taro.yamada@pantore.test', assignedAt: new Date('2025-02-01'), handoverNote: null },
];

export const mockMinutes = [
    { id: 'mn_1', dealId: 'd_1', title: '2024-02-15 キックオフMTG', body: '・プロジェクト概要の共有\n・開発スケジュールの確認\n・先方担当: 田村様、弊社: 山田\n・次回MTG: 3月1日', createdAt: new Date('2024-02-15') },
    { id: 'mn_2', dealId: 'd_1', title: '2024-03-01 進捗確認MTG', body: '・フェーズ1（要件定義）完了\n・フェーズ2（設計）着手予定 3/15〜\n・懸念点: データ移行の工数見直し必要', createdAt: new Date('2024-03-01') },
    { id: 'mn_3', dealId: 'd_2', title: '2024-04-15 月次レビュー', body: '・SLA達成状況: 99.8%（目標99.5%）\n・障害0件\n・次月の対応項目: セキュリティパッチ適用', createdAt: new Date('2024-04-15') },
    { id: 'mn_4', dealId: 'd_3', title: '2025-02-10 データ要件確認', body: '・対象期間: 2024年Q4〜2025年Q1\n・SKU数: 約3,200件\n・アウトプット形式: PDF + Excelの両対応', createdAt: new Date('2025-02-10') },
];

export const mockInvoices = [
    { id: 'inv_1', dealId: 'd_1', number: 'INV-2024-001', amount: 750000, issuedAt: new Date('2024-03-31'), status: 'paid' as const, dueDate: new Date('2024-04-20') },
    { id: 'inv_2', dealId: 'd_1', number: 'INV-2024-002', amount: 750000, issuedAt: new Date('2024-07-31'), status: 'paid' as const, dueDate: new Date('2024-08-20') },
    { id: 'inv_3', dealId: 'd_2', number: 'INV-2024-003', amount: 120000, issuedAt: new Date('2024-04-30'), status: 'paid' as const, dueDate: new Date('2024-05-20') },
    { id: 'inv_4', dealId: 'd_2', number: 'INV-2024-004', amount: 120000, issuedAt: new Date('2024-05-31'), status: 'paid' as const, dueDate: new Date('2024-06-20') },
    { id: 'inv_5', dealId: 'd_2', number: 'INV-2026-001', amount: 120000, issuedAt: new Date('2026-03-31'), status: 'pending' as const, dueDate: new Date('2026-04-20') },
    { id: 'inv_6', dealId: 'd_3', number: 'INV-2025-001', amount: 480000, issuedAt: new Date('2025-04-30'), status: 'pending' as const, dueDate: new Date('2025-05-20') },
];

export const mockContracts = [
    { id: 'cd_1', dealId: 'd_1', title: '業務委託契約書（食品管理システム導入支援）', generatedAt: new Date('2024-01-25'), signedAt: new Date('2024-01-30'), status: 'signed' as const },
    { id: 'cd_2', dealId: 'd_1', title: '作業範囲変更覚書 第1号', generatedAt: new Date('2024-04-10'), signedAt: new Date('2024-04-15'), status: 'signed' as const },
    { id: 'cd_3', dealId: 'd_2', title: 'システム保守委託契約書', generatedAt: new Date('2024-03-20'), signedAt: new Date('2024-03-25'), status: 'signed' as const },
    { id: 'cd_4', dealId: 'd_2', title: '保守契約 自動更新通知書（2025年度）', generatedAt: new Date('2025-01-15'), signedAt: null, status: 'draft' as const },
    { id: 'cd_5', dealId: 'd_3', title: 'データ分析業務委託契約書', generatedAt: new Date('2025-01-28'), signedAt: new Date('2025-01-31'), status: 'signed' as const },
];
