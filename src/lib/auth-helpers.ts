import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Auth Verification ───────────────────────────────────────────

export async function verifyAuth(request: NextRequest): Promise<{ uid: string; email: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header', 401);
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    throw new AuthError('Missing ID token', 401);
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email || '' };
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }
}

// ─── User Profile ────────────────────────────────────────────────

export interface UserProfile {
  email: string;
  displayName: string;
  freeFixesUsed: number;
  freeFixesLimit: number;
  fixesRemaining: number;
  totalPaidFixes: number;
  isAdmin: boolean;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const userDoc = await adminDb.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    // Auto-create user document if missing (defensive)
    const defaults: UserProfile = {
      email: '',
      displayName: 'User',
      freeFixesUsed: 0,
      freeFixesLimit: 1,
      fixesRemaining: 0,
      totalPaidFixes: 0,
      isAdmin: false,
    };
    await adminDb.collection('users').doc(uid).set({
      ...defaults,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return defaults;
  }

  const data = userDoc.data()!;
  return {
    email: data.email || '',
    displayName: data.displayName || 'User',
    freeFixesUsed: data.freeFixesUsed || 0,
    freeFixesLimit: data.freeFixesLimit ?? 1,
    fixesRemaining: data.fixesRemaining || 0,
    totalPaidFixes: data.totalPaidFixes || 0,
    isAdmin: data.isAdmin || false,
  };
}

// ─── Credit System ───────────────────────────────────────────────

export interface CreditCheck {
  canFix: boolean;
  fixType: 'free' | 'paid' | 'none';
  freeFixesUsed: number;
  freeFixesLimit: number;
  fixesRemaining: number;
}

export async function requireCredits(uid: string): Promise<CreditCheck> {
  const profile = await getUserProfile(uid);

  // Check free fixes first
  if (profile.freeFixesUsed < profile.freeFixesLimit) {
    return {
      canFix: true,
      fixType: 'free',
      freeFixesUsed: profile.freeFixesUsed,
      freeFixesLimit: profile.freeFixesLimit,
      fixesRemaining: profile.fixesRemaining,
    };
  }

  // Check paid fixes
  if (profile.fixesRemaining > 0) {
    return {
      canFix: true,
      fixType: 'paid',
      freeFixesUsed: profile.freeFixesUsed,
      freeFixesLimit: profile.freeFixesLimit,
      fixesRemaining: profile.fixesRemaining,
    };
  }

  return {
    canFix: false,
    fixType: 'none',
    freeFixesUsed: profile.freeFixesUsed,
    freeFixesLimit: profile.freeFixesLimit,
    fixesRemaining: profile.fixesRemaining,
  };
}

export async function deductCredit(
  uid: string,
  fixType: 'free' | 'paid' | 'coupon',
  resumeTitle?: string
): Promise<void> {
  const userRef = adminDb.collection('users').doc(uid);

  if (fixType === 'free') {
    await userRef.update({
      freeFixesUsed: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // paid or coupon — deduct from fixesRemaining
    await userRef.update({
      fixesRemaining: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Log the fix
  await adminDb.collection('resumeFixes').add({
    userId: uid,
    resumeTitle: resumeTitle || 'Untitled',
    fixType,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ─── Error Handling ──────────────────────────────────────────────

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('Unexpected error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
