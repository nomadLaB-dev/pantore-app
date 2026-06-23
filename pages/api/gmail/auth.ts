import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()

    try {
        const host = req.headers.host ?? 'localhost:3000'
        const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `http://${host}/api/gmail/callback`
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUri,
        )

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify',
            ],
            prompt: 'consent',
        })

        res.redirect(url)
    } catch (error: any) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}
