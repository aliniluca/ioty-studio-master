import { NextRequest, NextResponse } from 'next/server'

type SubscribeBody = {
  email?: string
  userType?: 'seller' | 'buyer'
  tags?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeBody
    const email = (body.email || '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    }

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

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Newsletter subscription error:', err);

    // Handle JSON parsing errors specifically
    if (err.message && err.message.includes('JSON')) {
      return NextResponse.json({
        error: 'Invalid response from newsletter service. Please try again.'
      }, { status: 500 });
    }

    return NextResponse.json({
      error: err.message || 'Unexpected error'
    }, { status: 500 });
  }
}
