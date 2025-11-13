import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, name, userType, customFields } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get the appropriate list ID
    const listId = userType === 'seller' 
      ? process.env.AWEBER_SELLER_LIST_ID 
      : process.env.AWEBER_BUYER_LIST_ID

    if (!listId) {
      return NextResponse.json({ error: 'AWeber list not configured for this user type' }, { status: 500 })
    }

    // Use direct API credentials
    const accessToken = process.env.AWEBER_ACCESS_TOKEN
    const accountId = process.env.AWEBER_ACCOUNT_ID

    if (!accessToken || !accountId) {
      return NextResponse.json({ 
        error: 'AWeber credentials not configured' 
      }, { status: 500 })
    }

    // Subscribe to AWeber list
    const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`
    
    const payload = {
      email: email,
      name: name || '',
      custom_fields: {
        ...customFields,
        'signup_method': 'registration',
        'signup_date': new Date().toISOString()
      },
      tags: [userType, 'new-user', 'registration']
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ 
        success: true, 
        message: 'User registered and subscribed to newsletter',
        subscriberId: data.entries?.[0]?.id
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.error?.message || `AWeber API error: ${response.status}` 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('AWeber user registration error:', error)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
