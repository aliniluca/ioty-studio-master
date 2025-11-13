import { NextRequest, NextResponse } from 'next/server'
import { subscribeGoogleUserServer } from '@/lib/aweber-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, customFields, tags } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await subscribeGoogleUserServer({
      email,
      name,
      customFields,
      tags
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      subscriberId: result.subscriberId 
    })
  } catch (error: any) {
    console.error('AWeber Google user subscription API error:', error)
    return NextResponse.json({ error: 'Failed to subscribe Google user' }, { status: 500 })
  }
}
