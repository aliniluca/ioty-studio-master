/**
 * Server-side AWeber token storage using Firestore Admin SDK
 * Tokens are stored globally (not per-user) since AWeber integration is global
 * Uses Admin SDK to bypass security rules (server-side only)
 */

import { adminDb } from './firebase-admin'

const COLLECTION = 'app_settings'
const DOCUMENT_ID = 'aweber_tokens'

export interface AWeberTokens {
  access_token: string
  refresh_token: string
  expires_at: number // Unix timestamp in milliseconds
  account_id?: string
  updated_at: number // Unix timestamp in milliseconds
}

/**
 * Save AWeber tokens to Firestore using Admin SDK
 */
export async function saveAWeberTokens(tokens: AWeberTokens): Promise<void> {
  try {
    const tokenRef = adminDb.collection(COLLECTION).doc(DOCUMENT_ID)
    await tokenRef.set({
      ...tokens,
      updated_at: Date.now()
    })
    console.log('AWeber tokens saved to Firestore:', {
      expires_at: new Date(tokens.expires_at).toISOString(),
      has_account_id: !!tokens.account_id
    })
  } catch (error) {
    console.error('Failed to save AWeber tokens to Firestore:', error)
    throw error
  }
}

/**
 * Get AWeber tokens from Firestore using Admin SDK
 */
export async function getAWeberTokens(): Promise<AWeberTokens | null> {
  try {
    const tokenRef = adminDb.collection(COLLECTION).doc(DOCUMENT_ID)
    const tokenDoc = await tokenRef.get()

    if (!tokenDoc.exists) {
      console.log('No AWeber tokens found in Firestore')
      return null
    }

    const data = tokenDoc.data() as AWeberTokens
    console.log('AWeber tokens retrieved from Firestore:', {
      has_access_token: !!data.access_token,
      has_refresh_token: !!data.refresh_token,
      expires_at: new Date(data.expires_at).toISOString(),
      is_expired: Date.now() >= data.expires_at
    })

    return data
  } catch (error) {
    console.error('Failed to get AWeber tokens from Firestore:', error)
    throw error
  }
}

/**
 * Delete AWeber tokens from Firestore using Admin SDK
 */
export async function deleteAWeberTokens(): Promise<void> {
  try {
    const tokenRef = adminDb.collection(COLLECTION).doc(DOCUMENT_ID)
    await tokenRef.set({
      access_token: '',
      refresh_token: '',
      expires_at: 0,
      updated_at: Date.now()
    })
    console.log('AWeber tokens deleted from Firestore')
  } catch (error) {
    console.error('Failed to delete AWeber tokens from Firestore:', error)
    throw error
  }
}
