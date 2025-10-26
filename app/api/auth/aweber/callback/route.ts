import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Handle OAuth errors
  if (error) {
    console.error('AWeber OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=${encodeURIComponent(error)}`)
  }

  // Validate required parameters
  if (!code) {
    console.error('No authorization code received from AWeber')
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=no_code`)
  }

  // Validate state parameter for security
  const cookieStore = cookies()
  const storedState = cookieStore.get('aweber_oauth_state')?.value
  
  
  if (!state || !storedState || state !== storedState) {
    console.error('Invalid or missing state parameter:', {
      receivedState: state,
      storedState: storedState,
      statesMatch: state === storedState
    });
    
    // Temporary bypass for debugging - remove in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Bypassing state validation in development mode');
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=invalid_state`)
    }
  }

  try {
    // Exchange authorization code for access token using Basic Authentication
    const clientId = process.env.AWEBER_CLIENT_ID!
    const clientSecret = process.env.AWEBER_CLIENT_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/aweber/callback`
    
    // Create Basic Auth header as recommended by AWeber
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const tokenResponse = await fetch('https://auth.aweber.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('AWeber token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=no_access_token`)
    }

    // Get account information to find the account ID
    let accountId = ''
    try {
      const accountsResponse = await fetch('https://api.aweber.com/1.0/accounts', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        if (accountsData.entries && accountsData.entries.length > 0) {
          accountId = accountsData.entries[0].id
        }
      }
    } catch (accountError) {
      console.warn('Could not fetch account ID:', accountError)
    }

    // Store the access token and account ID in secure cookies

    cookieStore.set('aweber_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    if (accountId) {
      cookieStore.set('aweber_account_id', accountId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    }

    // Store refresh token if provided
    if (tokenData.refresh_token) {
      cookieStore.set('aweber_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/'
      })
    }

    // Clean up the OAuth state cookie
    cookieStore.delete('aweber_oauth_state')
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?success=true&connected=aweber`)

  } catch (error) {
    console.error('AWeber OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=oauth_callback_error`)
  }
}
