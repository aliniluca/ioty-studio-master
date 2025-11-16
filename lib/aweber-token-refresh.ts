// lib/aweber-token-refresh.ts
// Token refresh logic for AWeber OAuth

import { getAWeberTokens, storeAWeberTokens, isTokenExpired, type AWeberTokenData } from './aweber-token-storage'

interface TokenRefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

/**
 * Refresh AWeber access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<AWeberTokenData> {
  const clientId = process.env.AWEBER_CLIENT_ID
  const clientSecret = process.env.AWEBER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('AWeber credentials not configured')
  }

  const tokenUrl = 'https://auth.aweber.com/oauth2/token'
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token refresh failed:', errorText)
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as TokenRefreshResponse

  const tokenData: AWeberTokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Use new refresh token if provided
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type
  }

  // Store the new tokens
  await storeAWeberTokens(tokenData)

  return tokenData
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getAWeberTokens()

  if (!tokens) {
    throw new Error('No AWeber tokens found. Please complete OAuth authentication first.')
  }

  // Check if token is expired
  if (isTokenExpired(tokens.expires_at)) {
    console.log('Access token expired, refreshing...')
    const newTokens = await refreshAccessToken(tokens.refresh_token)
    return newTokens.access_token
  }

  return tokens.access_token
}

/**
 * Force refresh the access token
 */
export async function forceRefreshToken(): Promise<AWeberTokenData> {
  const tokens = await getAWeberTokens()

  if (!tokens) {
    throw new Error('No AWeber tokens found. Please complete OAuth authentication first.')
  }

  return await refreshAccessToken(tokens.refresh_token)
}
