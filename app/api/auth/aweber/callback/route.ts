// app/api/auth/aweber/callback/route.ts
// Handle AWeber OAuth callback

import { NextRequest, NextResponse } from 'next/server'
import { storeAWeberTokens, type AWeberTokenData } from '@/lib/aweber-token-storage'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('[AWeber Callback] Started processing OAuth callback')
  console.log('[AWeber Callback] Environment check:', {
    hasClientId: !!process.env.AWEBER_CLIENT_ID,
    hasClientSecret: !!process.env.AWEBER_CLIENT_SECRET,
    hasRedirectUri: !!process.env.AWEBER_REDIRECT_URI,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    hasFirebaseKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    hasFirebaseProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    redirectUri: process.env.AWEBER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/aweber/callback`
  })

  // Handle OAuth error
  if (error) {
    console.error('[AWeber Callback] OAuth error from AWeber:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?aweber_error=${encodeURIComponent(error)}`
    )
  }

  // Verify we have the authorization code
  if (!code) {
    console.error('[AWeber Callback] No authorization code provided')
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    )
  }

  try {
    console.log('[AWeber Callback] Exchanging code for tokens...')
    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(code)
    console.log('[AWeber Callback] Token exchange successful')

    console.log('[AWeber Callback] Storing tokens in Firestore...')
    // Store tokens in Firestore
    await storeAWeberTokens(tokenData)
    console.log('[AWeber Callback] Tokens stored successfully')

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?aweber_auth=success`
    )
  } catch (error: any) {
    console.error('[AWeber Callback] ERROR:', error)
    console.error('[AWeber Callback] Error stack:', error.stack)

    // Return JSON error for debugging
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(code: string): Promise<AWeberTokenData> {
  const clientId = process.env.AWEBER_CLIENT_ID
  const clientSecret = process.env.AWEBER_CLIENT_SECRET
  const redirectUri = process.env.AWEBER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/aweber/callback`

  if (!clientId || !clientSecret) {
    throw new Error('AWeber credentials not configured')
  }

  const tokenUrl = 'https://auth.aweber.com/oauth2/token'
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Token Exchange] Failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      redirectUri: redirectUri
    })
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`)
  }

  const data = await response.json() as TokenResponse
  console.log('[Token Exchange] Success - received tokens')

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type
  }
}
