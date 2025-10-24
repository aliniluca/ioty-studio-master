import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value
    const refreshToken = cookieStore.get('aweber_refresh_token')?.value

    // Don't expose actual tokens in response
    return NextResponse.json({
      hasAccessToken: !!accessToken,
      hasAccountId: !!accountId,
      hasRefreshToken: !!refreshToken,
      isConfigured: !!(accessToken && accountId),
      tokenPreview: accessToken ? accessToken.substring(0, 10) + '...' : null
    })
  } catch (error) {
    console.error('Error checking AWeber OAuth status:', error)
    return NextResponse.json({ 
      error: 'Failed to check OAuth status',
      hasAccessToken: false,
      hasAccountId: false,
      hasRefreshToken: false,
      isConfigured: false
    }, { status: 500 })
  }
}
