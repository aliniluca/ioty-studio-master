import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteAWeberTokens } from '@/lib/aweber-token-storage'

export async function POST(req: NextRequest) {
  try {
    // Clear AWeber tokens from Firestore
    await deleteAWeberTokens()

    // Clear OAuth state cookie (temporary cookie for OAuth flow)
    const cookieStore = await cookies()
    cookieStore.delete('aweber_oauth_state')

    console.log('AWeber tokens cleared from Firestore, redirecting to re-authentication')

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
