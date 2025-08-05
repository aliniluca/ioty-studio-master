// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getPerformance } from "firebase/performance";

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

// Initialize services only on client side
let analytics = null;
let performance = null;

if (typeof window !== "undefined") {
  // Initialize analytics only if supported
  isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
  
  // Initialize performance monitoring
  try {
    performance = getPerformance(app);
  } catch (error) {
    console.warn('Firebase Performance not available:', error);
  }
}

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence for better performance
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support persistence.');
    }
  });
}

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines if you want to use Firebase emulators
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export { app, analytics, performance, db, auth, googleProvider };
