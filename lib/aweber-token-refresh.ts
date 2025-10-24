/**
 * AWeber Token Refresh Utility
 * Handles refreshing expired access tokens
 */

export async function refreshAWeberToken(): Promise<{ access_token?: string; error?: string }> {
  try {
    const clientId = process.env.AWEBER_CLIENT_ID
    const clientSecret = process.env.AWEBER_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return { error: 'AWeber credentials not configured' }
    }

    // Get refresh token from cookies
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()
    const refreshToken = cookieStore.get('aweber_refresh_token')?.value

    if (!refreshToken) {
      return { error: 'No refresh token available' }
    }

    // Create Basic Auth header
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch('https://auth.aweber.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return { error: `Token refresh failed: ${errorData.error || response.status} - ${errorData.error_description || response.statusText}` }
    }

    const tokenData = await response.json()
    
    if (tokenData.access_token) {
      // Update the access token in cookies
      cookieStore.set('aweber_access_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      // Update refresh token if provided
      if (tokenData.refresh_token) {
        cookieStore.set('aweber_refresh_token', tokenData.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
        })
      }

      return { access_token: tokenData.access_token }
    }

    return { error: 'No access token in refresh response' }
  } catch (error: any) {
    console.error('AWeber token refresh error:', error)
    return { error: error.message || 'Token refresh failed' }
  }
}
