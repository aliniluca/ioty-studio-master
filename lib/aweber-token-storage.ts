// lib/aweber-token-storage.ts
// Server-side token storage using Firestore

import { getFirestore } from 'firebase-admin/firestore'
import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app'

// Initialize Firebase Admin SDK
function getFirestoreAdmin() {
  if (!getApps().length) {
    // Option 1: Use service account key (recommended)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    // Option 2: Use individual credentials
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (serviceAccount) {
      try {
        const credentials = JSON.parse(serviceAccount)

        // Ensure project_id is present
        if (!credentials.project_id) {
          throw new Error('Service account JSON is missing project_id field')
        }

        initializeApp({
          credential: cert(credentials),
          projectId: credentials.project_id
        })
      } catch (error) {
        console.error('Failed to parse Firebase service account credentials:', error)
        throw new Error('Invalid Firebase service account credentials: ' + (error as Error).message)
      }
    } else if (projectId && clientEmail && privateKey) {
      // Initialize with individual environment variables
      try {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n')
          }),
          projectId
        })
      } catch (error) {
        console.error('Failed to initialize Firebase Admin with individual credentials:', error)
        throw new Error('Invalid Firebase credentials: ' + (error as Error).message)
      }
    } else if (projectId) {
      // Minimal initialization with just project ID (limited functionality)
      try {
        initializeApp({
          projectId
        })
      } catch (error) {
        console.error('Failed to initialize Firebase Admin with project ID:', error)
        throw new Error('Invalid Firebase project ID: ' + (error as Error).message)
      }
    } else {
      throw new Error(
        'Firebase Admin SDK not configured. Please set one of:\n' +
        '1. FIREBASE_SERVICE_ACCOUNT_KEY (full service account JSON)\n' +
        '2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY\n' +
        '3. FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID (minimal)'
      )
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
