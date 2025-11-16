// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (works on both client and server)
let app: FirebaseApp;
let analytics: any;
let _db: Firestore;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

// Initialize Firebase app (can be used on both client and server)
app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore (works on both client and server)
_db = getFirestore(app);

// Client-side only services
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} else {
  // Server-side: analytics and auth are not available
  analytics = null as any;
  auth = null as any;
  googleProvider = null as any;
}

// Export everything
export { app, analytics, auth, googleProvider };
export const db = _db;
