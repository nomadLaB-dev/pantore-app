import { google } from 'googleapis';
import * as cheerio from 'cheerio';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  return handler();
}

export async function POST() {
  return handler();
}

async function handler() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return Response.json({ success: false, error: 'Missing Gmail credentials' }, { status: 500 });
  }

  try {
    const supabase = await createClient();

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI,
    );
    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const query = 'is:unread {subject:"依頼受領報告" subject:"変更依頼受領報告" subject:"キャンセル依頼受領報告"}';
    const searchRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    // 古い順から処理（同一番号は最新で上書き）
    const messages = (searchRes.data.messages || []).reverse();
    const results: string[][] = [];

    for (const msg of messages) {
      if (!msg.id) continue;

      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const payload = fullMsg.data.payload;
      let htmlBody = '';

      if (payload?.parts) {
        const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
        if (htmlPart?.body?.data) {
          htmlBody = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        } else {
          const altPart = payload.parts.find(p => p.mimeType === 'multipart/alternative');
          if (altPart?.parts) {
            const innerHtml = altPart.parts.find(p => p.mimeType === 'text/html');
            if (innerHtml?.body?.data) {
              htmlBody = Buffer.from(innerHtml.body.data, 'base64').toString('utf-8');
            }
          }
        }
      } else if (payload?.mimeType === 'text/html' && payload.body?.data) {
        htmlBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      if (htmlBody) {
        const $ = cheerio.load(htmlBody);
        const dataMap: Record<string, string> = {};

        $('table tr').each((_, tr) => {
          const cells = $(tr).find('td, th');
          if (cells.length >= 2) {
            const key = $(cells[0]).text().trim().replace(/：|:/g, '');
            const val = $(cells[1]).text().trim();
            if (key) dataMap[key] = val;
          }
        });

        let dateSplit = ['', ''];
        if (dataMap['希望集荷日時']) {
          const dt = dataMap['希望集荷日時'];
          const spaceIdx = dt.indexOf(' ');
          if (spaceIdx !== -1) {
            dateSplit[0] = dt.substring(0, spaceIdx);
            let timeStr = dt.substring(spaceIdx + 1).trim();
            timeStr = timeStr.replace(/\b(\d{2})(\d{2})\b/g, '$1:$2');
            dateSplit[1] = timeStr;
          } else {
            dateSplit[0] = dt;
          }
        }

        const mappedRow = [
          dataMap['お問い合わせ番号'] || '',
          dataMap['登録区分'] || '',
          dataMap['集荷先施設担当者'] || '',
          dataMap['集荷先電話番号'] || '',
          dataMap['施設名'] || '',
          dataMap['治験名'] || '',
          dateSplit[0],
          dateSplit[1],
          dataMap['訪問場所'] || '',
          dataMap['備考'] || '',
        ];

        results.push(mappedRow);

        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.id,
          requestBody: { removeLabelIds: ['UNREAD'] },
        });
      }
    }

    if (results.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (employee?.tenant_id) {
          const { data: draftRecord } = await supabase
            .from('data_entry_drafts')
            .select('state_json')
            .eq('tenant_id', employee.tenant_id)
            .eq('id', 'global')
            .maybeSingle();

          const stateJson: Record<string, string[][]> = (draftRecord?.state_json as Record<string, string[][]>) || {};
          const iTab = stateJson['i'] ? [...stateJson['i']] : [];
          let changed = false;

          for (const incomingRow of results) {
            const inquiryNo = incomingRow[0];
            if (!inquiryNo) continue;

            const existingIdx = iTab.findIndex(row => row[0] === inquiryNo);
            if (existingIdx !== -1) {
              iTab[existingIdx] = incomingRow;
              changed = true;
            } else {
              const emptyIdx = iTab.findIndex(row => row.every(cell => !cell || cell.trim() === ''));
              if (emptyIdx !== -1) {
                iTab[emptyIdx] = incomingRow;
              } else {
                iTab.push(incomingRow);
              }
              changed = true;
            }
          }

          if (changed) {
            stateJson['i'] = iTab;
            await supabase
              .from('data_entry_drafts')
              .upsert({
                id: 'global',
                tenant_id: employee.tenant_id,
                state_json: stateJson,
                updated_at: new Date().toISOString(),
              });
          }
        }
      }
    }

    return Response.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Gmail Fetch Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
