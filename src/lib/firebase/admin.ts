import { initializeApp, getApps, cert, type ServiceAccount, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getServiceAccount(): ServiceAccount {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!encoded) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  try {
    // Support both base64-encoded and raw JSON
    const json = encoded.startsWith('{') ? encoded : Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(json) as ServiceAccount;
  } catch {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY — ensure it is valid JSON or base64-encoded JSON');
  }
}

// Lazy initialization — only runs when first accessed at runtime, not at build time
let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp(): App {
  if (!_app) {
    if (getApps().length === 0) {
      _app = initializeApp({
        credential: cert(getServiceAccount()),
      });
    } else {
      _app = getApps()[0];
    }
  }
  return _app;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_auth) {
      getApp();
      _auth = getAuth();
    }
    return Reflect.get(_auth, prop);
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) {
      getApp();
      _db = getFirestore();
    }
    return Reflect.get(_db, prop);
  },
});
