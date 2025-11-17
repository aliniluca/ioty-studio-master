// app/api/auth/aweber/route.ts
// Initiate AWeber OAuth flow

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.AWEBER_CLIENT_ID

  if (!clientId) {
    return NextResponse.json(
      { error: 'AWeber client ID not configured' },
      { status: 500 }
    )
  }

  // Determine redirect URI (priority: env var > NEXT_PUBLIC_APP_URL > current request URL)
  let redirectUri = process.env.AWEBER_REDIRECT_URI

  if (!redirectUri) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      redirectUri = `${appUrl}/api/auth/aweber/callback`
    } else {
      // Fallback to current request URL
      const url = new URL(request.url)
      redirectUri = `${url.origin}/api/auth/aweber/callback`
    }
  }

  console.log('[AWeber OAuth] Initiating OAuth flow with redirect URI:', redirectUri)

  // Build OAuth authorization URL
  const authUrl = new URL('https://auth.aweber.com/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'account.read list.read subscriber.read subscriber.write')

  // Redirect to AWeber OAuth page
  return NextResponse.redirect(authUrl.toString())
}
