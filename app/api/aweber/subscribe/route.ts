import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletterServer } from '@/lib/aweber-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, customFields, tags } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await subscribeToNewsletterServer({
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
    console.error('AWeber subscription API error:', error)
    
    // Handle JSON parsing errors specifically
    if (error.message && error.message.includes('JSON')) {
      return NextResponse.json({ 
        error: 'Invalid response from AWeber. Please try again.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to subscribe' 
    }, { status: 500 });
  }
}
