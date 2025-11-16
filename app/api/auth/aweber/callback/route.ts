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
  const cookieStore = await cookies()
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

    // Calculate token expiration time
    // AWeber access tokens expire after 2 hours (7200 seconds)
    // Documentation: https://help.aweber.com/hc/en-us/articles/360002941894
    const expiresIn = tokenData.expires_in || 7200  // Default to 2 hours
    const expiresAt = Date.now() + (expiresIn * 1000) // Convert to milliseconds

    console.log('Token received:', {
      expiresIn,
      expiresInHours: expiresIn / 3600,
      expiresAt: new Date(expiresAt).toISOString(),
      hasRefreshToken: !!tokenData.refresh_token
    })

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
    // Cookie maxAge is longer than token expiry - we'll check expiration separately
    const cookieMaxAge = 60 * 60 * 24 * 30 // 30 days

    // Determine if we should use secure cookies (HTTPS)
    // Check if the base URL uses https OR if we're in production
    const isSecure = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https') || process.env.NODE_ENV === 'production'

    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
    }

    console.log('Setting AWeber cookies with options:', {
      ...cookieOptions,
      maxAge: cookieMaxAge,
      isSecure,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    })

    cookieStore.set('aweber_access_token', tokenData.access_token, {
      ...cookieOptions,
      maxAge: cookieMaxAge,
    })

    // Store token expiration timestamp
    cookieStore.set('aweber_token_expires_at', expiresAt.toString(), {
      ...cookieOptions,
      maxAge: cookieMaxAge,
    })

    if (accountId) {
      cookieStore.set('aweber_account_id', accountId, {
        ...cookieOptions,
        maxAge: cookieMaxAge,
      })
    }

    // Store refresh token - AWeber ALWAYS returns a new one
    // Per AWeber docs: refresh tokens don't expire but ARE rotated on each refresh
    if (!tokenData.refresh_token) {
      console.error('CRITICAL: No refresh token in response! Token data:', tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=no_refresh_token`)
    }

    cookieStore.set('aweber_refresh_token', tokenData.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 365, // 1 year (refresh tokens don't expire per AWeber docs)
    })

    console.log('All AWeber tokens stored successfully in cookies')

    // Verify cookies were actually set by reading them back
    const verifyToken = cookieStore.get('aweber_access_token')
    const verifyRefresh = cookieStore.get('aweber_refresh_token')
    console.log('Cookie verification:', {
      accessTokenSet: !!verifyToken?.value,
      refreshTokenSet: !!verifyRefresh?.value,
      cookieCount: cookieStore.getAll().length
    })

    // Clean up the OAuth state cookie
    cookieStore.delete('aweber_oauth_state')
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?success=true&connected=aweber`)

  } catch (error) {
    console.error('AWeber OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=oauth_callback_error`)
  }
}
