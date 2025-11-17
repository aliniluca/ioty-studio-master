// lib/aweber-server.ts
// Server-side AWeber API integration

import { getValidAccessToken } from './aweber-token-refresh'

const AWEBER_API_BASE = 'https://api.aweber.com/1.0'

export interface SubscribeOptions {
  email: string
  name?: string
  listId: string
  tags?: string[]
  customFields?: Record<string, string>
  adTracking?: string
}

export interface AWeberApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}

/**
 * Subscribe a user to an AWeber list
 */
export async function subscribeToAWeberList(options: SubscribeOptions): Promise<AWeberApiResponse> {
  try {
    const accessToken = await getValidAccessToken()
    const { email, name, listId, tags, customFields, adTracking } = options

    // Prepare subscriber data
    const subscriberData: any = {
      email,
      ad_tracking: adTracking || 'Website Signup'
    }

    // Add name if provided
    if (name) {
      const nameParts = name.trim().split(' ')
      if (nameParts.length > 0) {
        subscriberData.name = nameParts[0]
      }
      if (nameParts.length > 1) {
        subscriberData.last_name = nameParts.slice(1).join(' ')
      }
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      subscriberData.tags = tags
    }

    // Add custom fields if provided
    if (customFields && Object.keys(customFields).length > 0) {
      subscriberData.custom_fields = customFields
    }

    // Make request to AWeber API
    const url = `${AWEBER_API_BASE}/accounts/${await getAccountId(accessToken)}/lists/${listId}/subscribers`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriberData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      // Handle duplicate subscriber error gracefully
      if (response.status === 400 && responseData.error?.message?.includes('already subscribed')) {
        return {
          success: true,
          message: 'User is already subscribed to the list',
          data: responseData
        }
      }

      console.error('AWeber API error:', responseData)
      return {
        success: false,
        error: responseData.error?.message || 'Failed to subscribe user',
        data: responseData
      }
    }

    return {
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: responseData
    }
  } catch (error: any) {
    console.error('Error subscribing to AWeber:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Get AWeber account ID
 * Cached to avoid repeated API calls
 */
let cachedAccountId: string | null = null

async function getAccountId(accessToken: string): Promise<string> {
  if (cachedAccountId) {
    return cachedAccountId
  }

  const response = await fetch(`${AWEBER_API_BASE}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get AWeber account ID')
  }

  const data = await response.json()

  if (!data.entries || data.entries.length === 0) {
    throw new Error('No AWeber accounts found')
  }

  // Extract account ID from the URL
  const accountUrl = data.entries[0].self_link
  const accountId = accountUrl.split('/').pop()

  cachedAccountId = accountId
  return accountId
}

/**
 * Get all lists for the account
 */
export async function getAWeberLists(): Promise<AWeberApiResponse> {
  try {
    const accessToken = await getValidAccessToken()
    const accountId = await getAccountId(accessToken)

    const response = await fetch(`${AWEBER_API_BASE}/accounts/${accountId}/lists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || 'Failed to fetch lists'
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: data.entries
    }
  } catch (error: any) {
    console.error('Error fetching AWeber lists:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Helper function to subscribe users during signup/login
 */
export async function subscribeToNewsletterServer(options: {
  email: string
  name?: string
  listId: string
  tags?: string[]
  customFields?: Record<string, string>
}): Promise<AWeberApiResponse> {
  return await subscribeToAWeberList({
    ...options,
    adTracking: 'Website Signup'
  })
}
