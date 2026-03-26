import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getUserProfile, handleAuthError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await verifyAuth(request);
    const profile = await getUserProfile(uid);

    return NextResponse.json({
      freeFixesUsed: profile.freeFixesUsed,
      freeFixesLimit: profile.freeFixesLimit,
      fixesRemaining: profile.fixesRemaining,
      totalPaidFixes: profile.totalPaidFixes,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
