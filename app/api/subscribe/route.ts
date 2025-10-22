import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletter } from '@/lib/aweber'

// Toggle provider with env: NEWSLETTER_USE_AWEBER = 'true' | 'false'
const USE_AWEBER = (process.env.NEWSLETTER_USE_AWEBER || 'true').toLowerCase() === 'true'

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

    if (USE_AWEBER) {
      // Determine which list to use based on user type
      const listId = body.userType === 'seller' 
        ? process.env.AWEBER_SELLER_LIST_ID 
        : process.env.AWEBER_BUYER_LIST_ID

      if (!listId) {
        return NextResponse.json({ error: 'AWeber list not configured for this user type' }, { status: 500 })
      }

      // Use AWeber for newsletter subscription with appropriate list
      const result = await subscribeToNewsletter({
        email,
        tags: body.tags || ['newsletter', 'direct-subscription'],
        listId: listId
      })

      if (!result.success) {
        return NextResponse.json({ error: result.message || 'Failed to subscribe to newsletter' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, message: result.message })
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
