/**
 * Firebase Admin SDK for server-side operations
 * This bypasses Firestore security rules and has full database access
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    adminDb = getFirestore(adminApp);
    return { app: adminApp, db: adminDb };
  }

  try {
    // Initialize with service account credentials
    // For production, you should use a service account JSON file
    // For now, we'll use the regular Firebase config which works for Firestore
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // If you have a service account key, use:
      // credential: cert({
      //   projectId: process.env.FIREBASE_PROJECT_ID,
      //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      // })
    });

    adminDb = getFirestore(adminApp);

    console.log('Firebase Admin SDK initialized successfully');
    return { app: adminApp, db: adminDb };
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Initialize on module load
const { app, db } = initializeFirebaseAdmin();

export { app as adminApp, db as adminDb };
