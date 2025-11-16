/**
 * AWeber Token Refresh Utility
 * Handles refreshing expired access tokens
 */

export async function refreshAWeberToken(refreshToken: string): Promise<{ access_token?: string; error?: string }> {
  try {
    const clientId = process.env.AWEBER_CLIENT_ID
    const clientSecret = process.env.AWEBER_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return { error: 'AWeber credentials not configured' }
    }

    if (!refreshToken) {
      return { error: 'No refresh token provided' }
    }
    
    // Get cookies for updating tokens
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

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
      // Calculate token expiration time
      // AWeber access tokens expire after 2 hours (7200 seconds)
      const expiresIn = tokenData.expires_in || 7200 // Default to 2 hours
      const expiresAt = Date.now() + (expiresIn * 1000)

      console.log('Token refreshed successfully:', {
        expiresIn,
        expiresInHours: expiresIn / 3600,
        expiresAt: new Date(expiresAt).toISOString(),
        hasNewRefreshToken: !!tokenData.refresh_token,
        timestamp: new Date().toISOString()
      })

      const cookieMaxAge = 60 * 60 * 24 * 30 // 30 days

      // Determine if we should use secure cookies (HTTPS)
      const isSecure = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https') || process.env.NODE_ENV === 'production'

      const cookieOptions = {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax' as const,
      }

      // Update the access token in cookies
      cookieStore.set('aweber_access_token', tokenData.access_token, {
        ...cookieOptions,
        maxAge: cookieMaxAge,
      })

      // Update token expiration timestamp
      cookieStore.set('aweber_token_expires_at', expiresAt.toString(), {
        ...cookieOptions,
        maxAge: cookieMaxAge,
      })

      // CRITICAL: AWeber ALWAYS returns a new refresh token when you refresh
      // The old refresh token is invalidated. We MUST update to the new one.
      // Per AWeber docs: "You will receive a new token, an expires_in parameter, and a refresh token"
      if (!tokenData.refresh_token) {
        console.error('CRITICAL: AWeber did not return a refresh token in refresh response!', tokenData)
        return { error: 'No refresh token in refresh response - token rotation failed' }
      }

      cookieStore.set('aweber_refresh_token', tokenData.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 365, // 1 year (refresh tokens don't expire)
      })

      console.log('All tokens updated successfully including NEW refresh token')

      return { access_token: tokenData.access_token }
    }

    return { error: 'No access token in refresh response' }
  } catch (error: any) {
    console.error('AWeber token refresh error:', error)
    return { error: error.message || 'Token refresh failed' }
  }
}
