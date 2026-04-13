/**
 * 車両減価償却計算ロジック（国税庁ルールに基づく）
 * 定額法・定率法対応。中古車は耐用年数を短縮。
 */

export type VehicleBodyType =
    | 'passenger_standard'   // 普通乗用車（6年）
    | 'passenger_compact'    // 軽自動車（4年）
    | 'truck_dump'           // トラック・ダンプ式（4年）
    | 'truck_general'        // トラック・一般（5年）
    | 'transport_standard'   // 運送・貸自動車業・普通車（4年）
    | 'transport_compact';   // 運送・貸自動車業・小型車（5年）

export type DepreciationMethod = 'straight' | 'declining'; // 定額法 / 定率法

// 法定耐用年数マップ
const USEFUL_LIFE: Record<VehicleBodyType, number> = {
    passenger_standard: 6,
    passenger_compact: 4,
    truck_dump: 4,
    truck_general: 5,
    transport_standard: 4,
    transport_compact: 5,
};

export const VehicleBodyTypeLabel: Record<VehicleBodyType, string> = {
    passenger_standard: '普通乗用車',
    passenger_compact: '軽自動車',
    truck_dump: 'トラック（ダンプ式）',
    truck_general: 'トラック（一般）',
    transport_standard: '運送・貸自動車業（普通車）',
    transport_compact: '運送・貸自動車業（小型車）',
};

export const DepreciationMethodLabel: Record<DepreciationMethod, string> = {
    straight: '定額法',
    declining: '定率法',
};

// 定率法の償却率テーブル（国税庁・200%定率法）
// 耐用年数 → 償却率
const DECLINING_RATE: Record<number, number> = {
    2: 1.000,
    3: 0.667,
    4: 0.500,
    5: 0.400,
    6: 0.333,
};

// 定率法の保証率（耐用年数別）
const DECLINING_GUARANTEE_RATE: Record<number, number> = {
    2: 0.5,
    3: 0.11089,
    4: 0.12499,
    5: 0.10800,
    6: 0.09911,
};

/**
 * 中古車の耐用年数を計算する
 * (法定耐用年数 - 経過年数) + 経過年数 × 0.2
 * 1年未満は切り捨て、最低2年
 */
export function calcUsedCarUsefulLife(legalYears: number, elapsedYears: number): number {
    if (elapsedYears >= legalYears) {
        // 法定耐用年数を超えて経過している場合
        return Math.max(2, Math.floor(legalYears * 0.2));
    }
    const raw = (legalYears - elapsedYears) + elapsedYears * 0.2;
    return Math.max(2, Math.floor(raw));
}

/**
 * 有効な耐用年数を返す（新車 or 中古）
 */
export function getUsefulLife(params: {
    bodyType: VehicleBodyType;
    isNewCar: boolean;
    purchaseDate: Date;
    firstRegistrationDate?: Date; // 初度登録年月（中古の場合）
}): number {
    const legalYears = USEFUL_LIFE[params.bodyType];
    if (params.isNewCar || !params.firstRegistrationDate) return legalYears;

    const elapsed = (params.purchaseDate.getTime() - params.firstRegistrationDate.getTime())
        / (1000 * 60 * 60 * 24 * 365.25);
    return calcUsedCarUsefulLife(legalYears, elapsed);
}

export interface DepreciationScheduleRow {
    year: number;        // 年度（1始まり）
    fiscalYear: number;  // 西暦
    bookValueStart: number;
    depreciation: number;
    bookValueEnd: number;
    accumulatedDepreciation: number;
    fullyDepreciated: boolean;
}

/**
 * 減価償却スケジュールを計算する
 */
export function calcDepreciationSchedule(params: {
    acquisitionCost: number;   // 取得価額（本体＋付帯費用合計）
    usefulLife: number;         // 耐用年数
    method: DepreciationMethod;
    purchaseYear: number;       // 取得年
    residualRate?: number;      // 残存率（デフォルト0 = 備忘価額1円）
}): DepreciationScheduleRow[] {
    const { acquisitionCost, usefulLife, method, purchaseYear } = params;
    const residualValue = 1; // 備忘価額1円（実務的デフォルト）

    const rows: DepreciationScheduleRow[] = [];
    let bookValue = acquisitionCost;
    let accumulated = 0;

    if (method === 'straight') {
        // 定額法: 毎年同額 = 取得価額 × 1/耐用年数
        const annualAmt = Math.floor(acquisitionCost / usefulLife);

        for (let y = 1; y <= usefulLife; y++) {
            const dep = y === usefulLife
                ? Math.max(0, bookValue - residualValue) // 最終年は残存まで
                : Math.min(annualAmt, bookValue - residualValue);
            accumulated += dep;
            rows.push({
                year: y,
                fiscalYear: purchaseYear + y - 1,
                bookValueStart: bookValue,
                depreciation: dep,
                bookValueEnd: bookValue - dep,
                accumulatedDepreciation: accumulated,
                fullyDepreciated: bookValue - dep <= residualValue,
            });
            bookValue -= dep;
            if (bookValue <= residualValue) break;
        }
    } else {
        // 定率法（200%定率法）
        const rate = DECLINING_RATE[usefulLife] ?? (2 / usefulLife);
        const guaranteeRate = DECLINING_GUARANTEE_RATE[usefulLife] ?? 0;
        const guaranteeAmount = Math.floor(acquisitionCost * guaranteeRate);
        let usingStraight = false;
        const straightAmt = usingStraight ? 0 : Math.floor(bookValue / (usefulLife - 0));

        for (let y = 1; y <= usefulLife; y++) {
            const decliningAmt = Math.floor(bookValue * rate);
            const remainingYears = usefulLife - y + 1;
            const straightAmtNow = Math.ceil(bookValue / remainingYears);

            // 定率法の額が保証額を下回ったら定額法へ切替
            if (decliningAmt < guaranteeAmount || usingStraight) {
                usingStraight = true;
            }

            const dep = usingStraight
                ? Math.min(straightAmtNow, bookValue - residualValue)
                : Math.min(decliningAmt, bookValue - residualValue);

            accumulated += dep;
            const newBookValue = bookValue - dep;

            rows.push({
                year: y,
                fiscalYear: purchaseYear + y - 1,
                bookValueStart: bookValue,
                depreciation: dep,
                bookValueEnd: newBookValue,
                accumulatedDepreciation: accumulated,
                fullyDepreciated: newBookValue <= residualValue,
            });

            bookValue = newBookValue;
            if (bookValue <= residualValue) break;
        }
    }

    return rows;
}
