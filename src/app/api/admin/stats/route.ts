import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getUserProfile, handleAuthError, AuthError } from '@/lib/auth-helpers';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await verifyAuth(request);
    const profile = await getUserProfile(uid);

    if (!profile.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get counts in parallel
    const [usersSnap, fixesSnap, paymentsSnap, couponsSnap] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('resumeFixes').count().get(),
      adminDb.collection('payments').where('status', '==', 'completed').get(),
      adminDb.collection('couponCodes').where('isActive', '==', true).count().get(),
    ]);

    const totalRevenue = paymentsSnap.docs.reduce((sum, doc) => {
      return sum + (doc.data().amountCents || 0);
    }, 0);

    return NextResponse.json({
      totalUsers: usersSnap.data().count,
      totalFixes: fixesSnap.data().count,
      totalRevenueCents: totalRevenue,
      totalPayments: paymentsSnap.size,
      activeCoupons: couponsSnap.data().count,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
