import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { saveAWeberTokens } from '@/lib/aweber-token-storage'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Handle OAuth errors
  if (error) {
    console.error('AWeber OAuth error:', error)
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=${encodeURIComponent(error)}`
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Validate required parameters
  if (!code) {
    console.error('No authorization code received from AWeber')
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=no_code`
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
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
      const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=invalid_state`
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
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
      const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=token_exchange_failed`
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    }

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData)
      const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=no_access_token`
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
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

    // Store refresh token - AWeber ALWAYS returns a new one
    // Per AWeber docs: refresh tokens don't expire but ARE rotated on each refresh
    if (!tokenData.refresh_token) {
      console.error('CRITICAL: No refresh token in response! Token data:', tokenData)
      const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=no_refresh_token`
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Save tokens to Firestore (server-side storage)
    await saveAWeberTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      account_id: accountId || undefined,
      updated_at: Date.now()
    })

    console.log('AWeber tokens saved successfully to Firestore')

    // Clean up the OAuth state cookie
    cookieStore.delete('aweber_oauth_state')

    // Use client-side redirect instead of server-side for better mobile/incognito compatibility
    // Server-side redirects can fail to persist cookies on mobile browsers
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?success=true&connected=aweber`

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Authorization successful! Redirecting...</p>
          <script>
            window.location.href = "${redirectUrl}";
          </script>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )

  } catch (error) {
    console.error('AWeber OAuth callback error:', error)
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?error=oauth_callback_error`
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>window.location.href = "${redirectUrl}";</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
