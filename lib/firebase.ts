// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

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

// Make sure we don't initialize the app more than once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Only get analytics on the client
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const db = getFirestore(app);

// Only initialize auth and googleProvider on the client side
// Server components should not use auth directly
let auth: ReturnType<typeof getAuth>;
let googleProvider: GoogleAuthProvider;

if (typeof window !== "undefined") {
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} else {
  // Provide stub for server-side (will not be used)
  auth = null as any;
  googleProvider = null as any;
}

export { app, analytics, db, auth, googleProvider };
