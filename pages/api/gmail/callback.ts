import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    const code = req.query.code as string | undefined
    if (!code) {
        return res.status(400).send('認証コードが見つかりません')
    }

    try {
        const host = req.headers.host ?? 'localhost:3000'
        const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `http://${host}/api/gmail/callback`
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUri,
        )

        const { tokens } = await oauth2Client.getToken(code)

        const html = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>認証成功！</h2>
          <p>以下のリフレッシュトークンを .env.local の GOOGLE_REFRESH_TOKEN に設定してください。</p>
          <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; word-break: break-all;">
GOOGLE_REFRESH_TOKEN="${tokens.refresh_token ?? '（既に取得済みのため、新たに発行されませんでした。Googleアカウント設定欄からアプリへのアクセスを一度取り消してやり直してください）'}"
          </pre>
        </body>
      </html>
    `

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.status(200).send(html)
    } catch (error: any) {
        console.error(error)
        res.status(500).send(`エラーが発生しました: ${error.message}`)
    }
}
