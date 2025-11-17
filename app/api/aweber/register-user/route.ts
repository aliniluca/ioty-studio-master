// app/api/aweber/register-user/route.ts
// Subscribe new users during registration

import { NextRequest, NextResponse } from 'next/server'
import { subscribeToAWeberList } from '@/lib/aweber-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, userType, customFields } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Determine which list to use based on user type
    const listId = userType === 'seller'
      ? process.env.AWEBER_SELLER_LIST_ID
      : process.env.AWEBER_BUYER_LIST_ID

    if (!listId) {
      console.warn(`No AWeber list configured for user type: ${userType}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Newsletter list not configured for this user type'
        },
        { status: 500 }
      )
    }

    // Subscribe user to AWeber
    const result = await subscribeToAWeberList({
      email,
      name,
      listId,
      tags: ['registration', userType || 'buyer'],
      customFields: {
        ...customFields,
        user_type: userType || 'buyer',
        source: 'website_registration'
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
    console.error('Error in register-user route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
