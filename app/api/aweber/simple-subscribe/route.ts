import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, userType, tags } = await req.json()
    
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

    // Get OAuth tokens from cookies
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value

    console.log('OAuth token check:', {
      hasAccessToken: !!accessToken,
      hasAccountId: !!accountId,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none',
      accountId: accountId
    })

    if (!accessToken || !accountId) {
      return NextResponse.json({ 
        error: 'AWeber OAuth not completed. Please complete OAuth flow first by visiting /api/auth/aweber?action=connect' 
      }, { status: 401 })
    }

    // Subscribe to AWeber list using direct API
    const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`
    
    const payload = {
      email: email,
      name: '',
      custom_fields: {},
      tags: tags || ['newsletter', 'direct-subscription']
    }

    // First, test if the token is valid by getting account info
    console.log('Testing token validity...')
    const testResponse = await fetch('https://api.aweber.com/1.0/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!testResponse.ok) {
      const testError = await testResponse.text()
      console.error('Token validation failed:', testResponse.status, testError)
      return NextResponse.json({ 
        error: `Access token is invalid or expired. Status: ${testResponse.status}` 
      }, { status: 401 })
    }

    console.log('Token is valid, proceeding with subscription...')
    console.log('Subscribing to AWeber:', { email, userType, listId, accountId })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    console.log('AWeber API response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('AWeber API error details:', errorText)
    }

    if (response.ok) {
      const data = await response.json()
      console.log('AWeber success:', data)
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter',
        subscriberId: data.entries?.[0]?.id
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('AWeber API error:', errorData)
      return NextResponse.json({ 
        error: errorData.error?.message || `AWeber API error: ${response.status}` 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('AWeber subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe to newsletter' }, { status: 500 })
  }
}
