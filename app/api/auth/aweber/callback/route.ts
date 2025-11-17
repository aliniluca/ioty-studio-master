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

  // Handle OAuth error
  if (error) {
    console.error('AWeber OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?aweber_error=${encodeURIComponent(error)}`
    )
  }

  // Verify we have the authorization code
  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    )
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(code)

    // Store tokens in Firestore
    await storeAWeberTokens(tokenData)

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?aweber_auth=success`
    )
  } catch (error: any) {
    console.error('Error in AWeber callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?aweber_error=${encodeURIComponent(error.message)}`
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
    console.error('Token exchange failed:', errorText)
    throw new Error(`Failed to exchange code for tokens: ${response.status}`)
  }

  const data = await response.json() as TokenResponse

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type
  }
}
