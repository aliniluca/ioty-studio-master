import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value
    const refreshToken = cookieStore.get('aweber_refresh_token')?.value

    if (!accessToken || !accountId || !refreshToken) {
      return NextResponse.json({
        error: 'Missing tokens for refresh test',
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId,
        hasRefreshToken: !!refreshToken
      }, { status: 400 })
    }

    console.log('Testing token refresh...', {
      accountId,
      tokenPreview: accessToken.substring(0, 10) + '...',
      refreshTokenPreview: refreshToken.substring(0, 10) + '...'
    });

    // Test the refresh token mechanism
    const { refreshAWeberToken } = await import('@/lib/aweber-token-refresh')
    const refreshResult = await refreshAWeberToken()

    console.log('Token refresh result:', refreshResult)

    return NextResponse.json({
      success: refreshResult.access_token ? true : false,
      message: refreshResult.access_token ? 'Token refresh successful' : 'Token refresh failed',
      error: refreshResult.error,
      hasNewToken: !!refreshResult.access_token,
      newTokenPreview: refreshResult.access_token ? refreshResult.access_token.substring(0, 10) + '...' : 'none'
    })

  } catch (error: any) {
    console.error('Token refresh test error:', error)
    return NextResponse.json({
      error: 'Failed to test token refresh',
      message: error.message
    }, { status: 500 })
  }
}
