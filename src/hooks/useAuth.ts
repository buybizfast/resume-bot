'use client';

import { useCallback } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from '@/lib/firebase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

const ACTION_CODE_SETTINGS = {
  url: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback',
  handleCodeInApp: true,
};

export function useAuth() {
  const { user, isLoading } = useAuthContext();

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'auth/popup-closed-by-user') return;
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/internal-error'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw error;
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
    }
  }, []);

  const completeMagicLinkSignIn = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    const auth = getFirebaseAuth();

    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (!email) return null;

      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return result;
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithMagicLink,
    completeMagicLinkSignIn,
    signOut,
    getIdToken,
  };
}
