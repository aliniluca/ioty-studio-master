// app/api/auth/aweber/route.ts
// Initiate AWeber OAuth flow

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.AWEBER_CLIENT_ID
  const redirectUri = process.env.AWEBER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/aweber/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'AWeber client ID not configured' },
      { status: 500 }
    )
  }

  // Build OAuth authorization URL
  const authUrl = new URL('https://auth.aweber.com/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'account.read list.read subscriber.read subscriber.write')

  // Redirect to AWeber OAuth page
  return NextResponse.redirect(authUrl.toString())
}
