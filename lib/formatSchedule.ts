import type { ScheduleRow } from '@/types';
export type { ScheduleRow };

// =============================================
// ヘルパー
// =============================================

const isEmpty = (row: string[]) => row.every(cell => cell.trim() === '');

/**
 * "2026/04/02\n10:00 〜 15:00" → { date, time }
 * "WEB依頼確定\n2026/03/30 11:17" → { date: "2026/03/30", time: "11:17" }
 */
const splitLines = (val: string): [string, string] => {
  const parts = val.split('\n');
  return [parts[0]?.trim() ?? '', parts[1]?.trim() ?? ''];
};

/**
 * "2026/03/30 11:17" のような文字列を日付と時刻に分割
 */
const splitDatetime = (val: string): [string, string] => {
  const trimmed = val.trim();
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) return [trimmed, ''];
  return [trimmed.substring(0, spaceIdx).trim(), trimmed.substring(spaceIdx + 1).trim()];
};

// =============================================
// MDF / Q-dome 成形
// =============================================
// 入力カラム順 (COLUMNS_DEFAULT):
//  0:集荷予定日時  1:ステータス  2:手配状況送信時間  3:依頼  4:至急  5:集材種別
//  6:県名  7:施設名  8:集配業者搬入拠点  9:コード集材員名  10:リファレンス  11:SEQ  12:REV
export function formatMDFRows(rows: string[][], systemType: 'M' | 'Q'): ScheduleRow[] {
  const result: ScheduleRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmpty(row)) continue;

    const [collectDate, collectTime] = splitLines(row[0] ?? '');

    // 施設名: "342025\n広島市立病院" → コード + 名前
    const [facilityLine1, facilityLine2] = splitLines(row[7] ?? '');
    // 1行目が数字のみ（施設コード）かどうか判定
    const facilityCode = /^\d+$/.test(facilityLine1) ? facilityLine1 : '';
    const facilityName = facilityCode ? facilityLine2 : (facilityLine2 ? `${facilityLine1}\n${facilityLine2}` : facilityLine1);

    // 集配業者搬入拠点: "九州航空\nシューベルブリアン(広島)"
    const [carrier, base] = splitLines(row[8] ?? '');
    const baseDisplay = base || carrier; // 下段が搬入拠点、上段が業者名

    // コード集材員名: "002\n●勝本 配車済み"
    const [courierCode, courierName] = splitLines(row[9] ?? '');

    // 手配状況送信時間: "WEB依頼確定\n2026/03/30 11:17"
    const [, dispatchDatetime] = splitLines(row[2] ?? '');
    const [requestDate, requestTime] = splitDatetime(dispatchDatetime);

    // 備考: 至急フラグ + 集材種別
    const urgentStr = row[4]?.trim() ?? '';
    const materialStr = row[5]?.trim() ?? '';
    const note = [urgentStr, materialStr].filter(Boolean).join(' ');

    result.push({
      id: `${systemType}-${i}-${Date.now()}`,
      systemType,
      deliveryType: row[1]?.trim() ?? '',    // ステータス (TNT手配確定 etc.)
      uid: row[11]?.trim() ?? '',             // SEQ
      collectDate,
      collectTime,
      area: row[6]?.trim() ?? '',             // 県名
      base: carrier ? `${carrier} ${baseDisplay}` : baseDisplay,
      facilityCode,
      facilityName,
      visitPlace: '',
      trialName: '',
      requestDate,
      requestTime,
      service: '',
      conNo: '',
      boxCount: '',
      request: row[3]?.trim() ?? '',          // 依頼
      courierCode,
      courierName,
      reference: row[10]?.trim() ?? '',
      rev: row[12]?.trim() ?? '',
      note,
      pickupDone: '',
      vehicleLoaded: '',
      unloaded: '',
      delivered: '',
    });
  }
  return result;
}

// =============================================
// IPD 成形
// =============================================
// 入力カラム順 (COLUMNS_IPD):
//  0:ID  1:配送種別  2:確認状況  3:ステータス  4:FedEx伝票番号  5:Box総数  6:集荷日時  7:集荷
//  8:集荷先  9:集荷エリア  10:配達先  11:配達エリア  12:配達日時  13:車載  14:荷降  15:配達
//  16:引き取り伝票番号  17:治験名  18:依頼日
export function formatIPDRows(rows: string[][]): ScheduleRow[] {
  const result: ScheduleRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmpty(row)) continue;

    const deliveryType = row[1]?.trim() ?? '';

    let collectDate = '';
    let collectTime = '';
    let facilityName = '';
    let area = '';
    let base = '';

    if (deliveryType === '転送集荷') {
      // 集荷日時 → 集配日・集配時間
      [collectDate, collectTime] = splitDatetime(row[6] ?? '');
      facilityName = row[8]?.trim() ?? '';   // 集荷先 → 集配施設名
      area = row[9]?.trim() ?? '';            // 集荷エリア → 集配エリア
    } else if (deliveryType === '転送配達') {
      // 配達日時 → 集配日・集配時間
      [collectDate, collectTime] = splitDatetime(row[12] ?? '');
      facilityName = row[10]?.trim() ?? '';  // 配達先 → 集配施設名
      area = row[11]?.trim() ?? '';          // 配達エリア → 集配エリア
    } else {
      // 不明な種別はデフォルトで集荷側を使用
      [collectDate, collectTime] = splitDatetime(row[6] ?? '');
      facilityName = row[8]?.trim() ?? '';
      area = row[9]?.trim() ?? '';
    }

    // 依頼日
    const [requestDate, requestTime] = splitDatetime(row[18] ?? '');

    result.push({
      id: `IP-${i}-${Date.now()}`,
      systemType: 'IP',
      deliveryType,                           // 配送種別はそのまま保持
      uid: row[0]?.trim() ?? '',              // ID
      collectDate,
      collectTime,
      area,
      base,
      facilityCode: '',
      facilityName,
      visitPlace: '',
      trialName: row[17]?.trim() ?? '',
      requestDate,
      requestTime,
      service: '',
      conNo: row[4]?.trim() ?? '',            // FedEx伝票番号
      boxCount: row[5]?.trim() ?? '',         // Box総数
      request: '',
      courierCode: '',
      courierName: '',
      reference: row[16]?.trim() ?? '',       // 引き取り伝票番号
      rev: '',
      note: `${row[2]?.trim() ?? ''} ${row[3]?.trim() ?? ''}`.trim(),
      pickupDone: row[7]?.trim() === 'true' ? 'true' : '',     // 集荷
      vehicleLoaded: row[13]?.trim() === 'true' ? 'true' : '', // 車載
      unloaded: row[14]?.trim() === 'true' ? 'true' : '',      // 荷降
      delivered: row[15]?.trim() === 'true' ? 'true' : '',     // 配達
    });
  }
  return result;
}

// =============================================
// Inter / Fedex メール 成形
// =============================================
// 入力カラム順 (COLUMNS_MAIL):
//  0:お問い合わせ番号  1:登録区分  2:集荷先施設担当者  3:集荷先電話番号
//  4:施設名  5:治験名  6:希望集荷日  7:希望集荷時間  8:訪問場所  9:備考
export function formatMailRows(rows: string[][], systemType: 'I' | 'F'): ScheduleRow[] {
  const result: ScheduleRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmpty(row)) continue;

    result.push({
      id: `${systemType}-${i}-${Date.now()}`,
      systemType,
      deliveryType: '',
      uid: row[0]?.trim() ?? '',             // お問い合わせ番号
      collectDate: row[6]?.trim() ?? '',     // 希望集荷日
      collectTime: row[7]?.trim() ?? '',     // 希望集荷時間
      area: '',
      base: '',
      facilityCode: '',
      facilityName: row[4]?.trim() ?? '',    // 施設名
      visitPlace: row[8]?.trim() ?? '',      // 訪問場所
      trialName: row[5]?.trim() ?? '',       // 治験名
      requestDate: '',
      requestTime: '',
      service: '',
      conNo: '',
      boxCount: '',
      request: '',
      courierCode: '',
      courierName: '',
      reference: '',
      rev: '',
      note: row[9]?.trim() ?? '',            // 備考
      pickupDone: '',
      vehicleLoaded: '',
      unloaded: '',
      delivered: '',
    });
  }
  return result;
}

// =============================================
// メインの集約関数
// =============================================
export function buildScheduleList(tabData: Record<string, string[][]>): ScheduleRow[] {
  const all: ScheduleRow[] = [];
  if (tabData['m'])  all.push(...formatMDFRows(tabData['m'], 'M'));
  if (tabData['q'])  all.push(...formatMDFRows(tabData['q'], 'Q'));
  if (tabData['ip']) all.push(...formatIPDRows(tabData['ip']));
  if (tabData['i'])  all.push(...formatMailRows(tabData['i'], 'I'));
  if (tabData['f'])  all.push(...formatMailRows(tabData['f'], 'F'));
  return all;
}
