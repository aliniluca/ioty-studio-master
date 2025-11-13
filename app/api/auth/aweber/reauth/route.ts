import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Clear all AWeber tokens
    const cookieStore = await cookies()
    cookieStore.delete('aweber_access_token')
    cookieStore.delete('aweber_account_id')
    cookieStore.delete('aweber_refresh_token')
    cookieStore.delete('aweber_token_expires_at')
    cookieStore.delete('aweber_oauth_state')

    console.log('AWeber tokens cleared, redirecting to re-authentication')

    // Redirect to OAuth flow
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/aweber?action=connect`)
  } catch (error: any) {
    console.error('Error during re-authentication:', error)
    return NextResponse.json({
      error: 'Failed to start re-authentication',
      message: error.message
    }, { status: 500 })
  }
}
