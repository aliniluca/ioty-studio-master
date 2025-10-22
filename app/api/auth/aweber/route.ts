import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'connect') {
    // Generate OAuth authorization URL
    const clientId = process.env.AWEBER_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/aweber/callback`
    
    if (!clientId) {
      return NextResponse.json({ error: 'AWeber client ID not configured' }, { status: 500 })
    }

    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    const authUrl = new URL('https://auth.aweber.com/oauth2/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'read write')
    authUrl.searchParams.set('state', state)

    // Store state in a cookie for validation
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set('aweber_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
