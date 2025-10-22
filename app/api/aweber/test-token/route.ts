import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token found. Please complete OAuth flow first.',
        instructions: [
          '1. Visit /api/aweber/oauth-setup to get OAuth URL',
          '2. Complete OAuth authorization',
          '3. Try this endpoint again'
        ]
      }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json({ 
        error: 'No account ID found. Please complete OAuth flow first.',
        instructions: [
          '1. Visit /api/aweber/oauth-setup to get OAuth URL',
          '2. Complete OAuth authorization',
          '3. Try this endpoint again'
        ]
      }, { status: 401 })
    }

    // Test the token by getting account info
    const response = await fetch('https://api.aweber.com/1.0/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ 
        success: true,
        message: 'Token is valid!',
        accountId: accountId,
        accounts: data.entries?.length || 0,
        tokenPreview: accessToken.substring(0, 20) + '...'
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: 'Token is invalid or expired',
        status: response.status,
        details: errorData,
        instructions: [
          '1. Visit /api/aweber/oauth-setup to get OAuth URL',
          '2. Complete OAuth authorization to get a fresh token',
          '3. Try this endpoint again'
        ]
      }, { status: 401 })
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Token test failed',
      details: error.message,
      instructions: [
        '1. Visit /api/aweber/oauth-setup to get OAuth URL',
        '2. Complete OAuth authorization',
        '3. Try this endpoint again'
      ]
    }, { status: 500 })
  }
}
