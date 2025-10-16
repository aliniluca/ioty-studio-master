import { NextRequest, NextResponse } from 'next/server'

// Toggle provider with env: NEWSLETTER_USE_MAILGUN = 'true' | 'false'
const USE_MAILGUN = (process.env.NEWSLETTER_USE_MAILGUN || 'false').toLowerCase() === 'true'

type SubscribeBody = {
  email?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeBody
    const email = (body.email || '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    }

    if (USE_MAILGUN) {
      const mgApiKey = process.env.MAILGUN_API_KEY
      const mgDomain = process.env.MAILGUN_DOMAIN
      const mgList = process.env.MAILGUN_LIST
      if (!mgApiKey || !mgDomain) {
        return NextResponse.json({ error: 'Mailgun not configured.' }, { status: 500 })
      }

      if (mgList) {
        const url = `https://api.mailgun.net/v3/lists/${encodeURIComponent(mgList)}/members`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`api:${mgApiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: email, subscribed: true, upsert: 'yes' }),
        })
        if (!res.ok) {
          const txt = await res.text()
          return NextResponse.json({ error: `Mailgun error: ${txt}` }, { status: 502 })
        }
      } else {
        const url = `https://api.mailgun.net/v3/${encodeURIComponent(mgDomain)}/messages`
        const form = new URLSearchParams()
        form.append('from', `Newsletter <newsletter@${mgDomain}>`)
        form.append('to', email)
        form.append('subject', 'You are subscribed!')
        form.append('text', 'Thanks for subscribing to our newsletter!')
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`api:${mgApiKey}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        })
        if (!res.ok) {
          const txt = await res.text()
          return NextResponse.json({ error: `Mailgun error: ${txt}` }, { status: 502 })
        }
      }
    } else {
      const host = process.env.GW_SMTP_HOST || 'smtp.gmail.com'
      const port = Number(process.env.GW_SMTP_PORT || 465)
      const user = process.env.GW_SMTP_USER
      const pass = process.env.GW_SMTP_PASS
      const from = process.env.GW_FROM_EMAIL || user
      if (!user || !pass || !from) {
        return NextResponse.json({ error: 'Google Workspace SMTP not configured.' }, { status: 500 })
      }

      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })

      await transporter.sendMail({
        from,
        to: email,
        subject: 'You are subscribed!',
        text: 'Thanks for subscribing to our newsletter!',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
