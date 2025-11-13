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

// Initialize Firebase app (safe for SSR)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Analytics - client only
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Firestore - safe for both SSR and client
const db: Firestore = getFirestore(app);

// Auth - client only to prevent SSR issues
let auth: Auth;
let googleProvider: GoogleAuthProvider;

if (typeof window !== "undefined") {
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} else {
  // Stub for server-side
  auth = null as any;
  googleProvider = null as any;
}

export { app, analytics, db, auth, googleProvider };
