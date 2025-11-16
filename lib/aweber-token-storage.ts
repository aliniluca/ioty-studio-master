// lib/aweber-token-storage.ts
// Server-side token storage using Firestore

import { getFirestore } from 'firebase-admin/firestore'
import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app'

// Initialize Firebase Admin SDK
function getFirestoreAdmin() {
  if (!getApps().length) {
    // Check if we have service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    if (serviceAccount) {
      try {
        const credentials = JSON.parse(serviceAccount)
        initializeApp({
          credential: cert(credentials)
        })
      } catch (error) {
        console.error('Failed to parse Firebase service account credentials:', error)
        throw new Error('Invalid Firebase service account credentials')
      }
    } else {
      // Fall back to default credentials (works in some environments)
      initializeApp()
    }
  }

  return getFirestore(getApp())
}

export interface AWeberTokenData {
  access_token: string
  refresh_token: string
  expires_at: number // Unix timestamp in milliseconds
  token_type: string
}

const TOKEN_COLLECTION = 'aweber_tokens'
const TOKEN_DOC_ID = 'main_account' // Single account for now

/**
 * Store AWeber OAuth tokens in Firestore
 */
export async function storeAWeberTokens(tokenData: AWeberTokenData): Promise<void> {
  try {
    const db = getFirestoreAdmin()
    await db.collection(TOKEN_COLLECTION).doc(TOKEN_DOC_ID).set({
      ...tokenData,
      updated_at: Date.now()
    })
    console.log('AWeber tokens stored successfully')
  } catch (error) {
    console.error('Error storing AWeber tokens:', error)
    throw error
  }
}

/**
 * Retrieve AWeber OAuth tokens from Firestore
 */
export async function getAWeberTokens(): Promise<AWeberTokenData | null> {
  try {
    const db = getFirestoreAdmin()
    const doc = await db.collection(TOKEN_COLLECTION).doc(TOKEN_DOC_ID).get()

    if (!doc.exists) {
      console.log('No AWeber tokens found in Firestore')
      return null
    }

    const data = doc.data() as AWeberTokenData & { updated_at: number }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      token_type: data.token_type
    }
  } catch (error) {
    console.error('Error retrieving AWeber tokens:', error)
    throw error
  }
}

/**
 * Check if the current access token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  // Add 5 minute buffer to refresh before actual expiration
  const bufferMs = 5 * 60 * 1000
  return Date.now() >= (expiresAt - bufferMs)
}

/**
 * Delete AWeber tokens from Firestore
 */
export async function deleteAWeberTokens(): Promise<void> {
  try {
    const db = getFirestoreAdmin()
    await db.collection(TOKEN_COLLECTION).doc(TOKEN_DOC_ID).delete()
    console.log('AWeber tokens deleted successfully')
  } catch (error) {
    console.error('Error deleting AWeber tokens:', error)
    throw error
  }
}
