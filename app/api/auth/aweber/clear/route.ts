import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Clear all AWeber OAuth cookies
    cookieStore.delete('aweber_access_token')
    cookieStore.delete('aweber_account_id')
    cookieStore.delete('aweber_refresh_token')
    cookieStore.delete('aweber_oauth_state')

    console.log('AWeber OAuth tokens cleared')

    return NextResponse.json({
      success: true,
      message: 'AWeber OAuth tokens cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing AWeber tokens:', error)
    return NextResponse.json({
      error: 'Failed to clear tokens',
      message: error.message
    }, { status: 500 })
  }
}
