import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // This endpoint helps you get your access token through OAuth
    const clientId = process.env.AWEBER_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/aweber/callback`
    
    if (!clientId) {
      return NextResponse.json({ error: 'AWeber client ID not configured' }, { status: 500 })
    }

    // Generate OAuth URL
    const authUrl = new URL('https://auth.aweber.com/oauth2/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'account.read list.read subscriber.read subscriber.write')
    authUrl.searchParams.set('state', 'setup')

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      instructions: [
        '1. Click the authUrl above to authorize',
        '2. After authorization, you will be redirected back',
        '3. The access token will be stored in cookies',
        '4. Your newsletter will work after this'
      ]
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to setup OAuth' }, { status: 500 })
  }
}
