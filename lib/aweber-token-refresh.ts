/**
 * AWeber Token Refresh Utility
 * Handles refreshing expired access tokens
 */

import { getAWeberTokens, saveAWeberTokens } from './aweber-token-storage'

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

    // Get existing tokens from Firestore to preserve account_id
    const existingTokens = await getAWeberTokens()

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

      // CRITICAL: AWeber ALWAYS returns a new refresh token when you refresh
      // The old refresh token is invalidated. We MUST update to the new one.
      // Per AWeber docs: "You will receive a new token, an expires_in parameter, and a refresh token"
      if (!tokenData.refresh_token) {
        console.error('CRITICAL: AWeber did not return a refresh token in refresh response!', tokenData)
        return { error: 'No refresh token in refresh response - token rotation failed' }
      }

      // Save updated tokens to Firestore
      await saveAWeberTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        account_id: existingTokens?.account_id,
        updated_at: Date.now()
      })

      console.log('All tokens updated successfully in Firestore including NEW refresh token')

      return { access_token: tokenData.access_token }
    }

    return { error: 'No access token in refresh response' }
  } catch (error: any) {
    console.error('AWeber token refresh error:', error)
    return { error: error.message || 'Token refresh failed' }
  }
}
