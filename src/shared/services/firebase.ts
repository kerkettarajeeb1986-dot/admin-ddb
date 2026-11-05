import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

// User-provided Firebase configuration for Dooars Daily Basket
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, any>);
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBqQAega2GMyo4YrfekR3NqXlo8W6hfFzs",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "dooars-daily-basket-53d8a.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://dooars-daily-basket-53d8a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "dooars-daily-basket-53d8a",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "dooars-daily-basket-53d8a.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "619270850844",
  appId: env.VITE_FIREBASE_APP_ID || "1:619270850844:web:e8498cee54e52a3bb552d9",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-317G42NWGY"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use auto-detect long polling to prevent intermittent connection failures in cloud/iframe environments
function initDb() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}
export const db = initDb();

// Safe Analytics initialization - strictly guarded
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  try {
    isSupported().then((supported) => {
      if (supported && firebaseConfig.appId) {
        try {
          analytics = getAnalytics(app);
        } catch {
          // Analytics optional, ignore
        }
      }
    }).catch(() => {});
  } catch {
    // Ignore analytics unsupported environment
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function handleFirestoreListenerError(
  error: unknown,
  path: string | null,
  fallback?: () => void
): void {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType: OperationType.GET,
    path,
  };
  console.warn('Firestore real-time listener notice:', JSON.stringify(errInfo));
  if (fallback) {
    fallback();
  }
}

