// app/api/auth/aweber/reauth/route.ts
// Force re-authentication or token refresh for AWeber

import { NextRequest, NextResponse } from 'next/server'
import { forceRefreshToken } from '@/lib/aweber-token-refresh'
import { deleteAWeberTokens } from '@/lib/aweber-token-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'refresh'

    if (action === 'refresh') {
      // Attempt to refresh the token
      const newTokens = await forceRefreshToken()
      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
        expires_at: newTokens.expires_at
      })
    } else if (action === 'revoke') {
      // Delete tokens and require new OAuth flow
      await deleteAWeberTokens()
      return NextResponse.json({
        success: true,
        message: 'Tokens revoked. Please re-authenticate.',
        reauth_url: '/api/auth/aweber'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "refresh" or "revoke"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Reauth error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to reauth',
        reauth_required: error.message?.includes('No AWeber tokens found')
      },
      { status: 500 }
    )
  }
}

// GET endpoint to simply redirect to OAuth flow
export async function GET(request: NextRequest) {
  // Delete existing tokens to force fresh authentication
  try {
    await deleteAWeberTokens()
  } catch (error) {
    console.error('Error deleting tokens:', error)
  }

  // Redirect to OAuth initiation
  return NextResponse.redirect(new URL('/api/auth/aweber', request.url))
}
