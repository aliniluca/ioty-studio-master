import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletterServer } from '@/lib/aweber-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, tags } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Debug subscription attempt:', { email, name, tags })

    const result = await subscribeToNewsletterServer({
      email,
      name,
      tags: tags || ['debug-test']
    })

    console.log('Debug subscription result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      subscriberId: result.subscriberId,
      debug: {
        email,
        name,
        tags
      }
    })
  } catch (error: any) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ 
      error: 'Debug subscription failed',
      message: error.message 
    }, { status: 500 })
  }
}
