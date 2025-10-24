import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    const aweberCookies = {
      accessToken: cookieStore.get('aweber_access_token')?.value,
      accountId: cookieStore.get('aweber_account_id')?.value,
      refreshToken: cookieStore.get('aweber_refresh_token')?.value,
      oauthState: cookieStore.get('aweber_oauth_state')?.value
    }

    return NextResponse.json({
      allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      aweberCookies: {
        hasAccessToken: !!aweberCookies.accessToken,
        hasAccountId: !!aweberCookies.accountId,
        hasRefreshToken: !!aweberCookies.refreshToken,
        hasOauthState: !!aweberCookies.oauthState,
        accountId: aweberCookies.accountId,
        tokenPreview: aweberCookies.accessToken ? aweberCookies.accessToken.substring(0, 10) + '...' : 'none'
      },
      environment: {
        hasEnvAccessToken: !!process.env.AWEBER_ACCESS_TOKEN,
        hasEnvAccountId: !!process.env.AWEBER_ACCOUNT_ID
      }
    })
  } catch (error: any) {
    console.error('Error checking cookies:', error)
    return NextResponse.json({
      error: 'Failed to check cookies',
      message: error.message
    }, { status: 500 })
  }
}
