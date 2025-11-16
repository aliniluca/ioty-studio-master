// app/api/aweber/subscribe-google-user/route.ts
// Subscribe Google sign-in users

import { NextRequest, NextResponse } from 'next/server'
import { subscribeToAWeberList } from '@/lib/aweber-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, customFields } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Use buyer list as default for Google sign-ins
    const listId = process.env.AWEBER_BUYER_LIST_ID

    if (!listId) {
      console.warn('No AWeber buyer list configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Newsletter list not configured'
        },
        { status: 500 }
      )
    }

    // Subscribe user to AWeber
    const result = await subscribeToAWeberList({
      email,
      name,
      listId,
      tags: ['google-signin', 'buyer'],
      customFields: {
        ...customFields,
        user_type: 'buyer',
        source: 'google_signin'
      }
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Successfully subscribed to newsletter'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to subscribe'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in subscribe-google-user route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
