import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, handleAuthError } from '@/lib/auth-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyAuth(request);
    const body = await request.json();

    const code = (body.code || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Please enter a coupon code.' }, { status: 400 });
    }

    // Find the coupon
    const couponSnap = await adminDb
      .collection('couponCodes')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (couponSnap.empty) {
      return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 });
    }

    const couponDoc = couponSnap.docs[0];
    const coupon = couponDoc.data();

    // Check expiration
    if (coupon.expiresAt) {
      const expiresAt = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
      }
    }

    // Check max redemptions
    if (coupon.maxRedemptions !== null && coupon.maxRedemptions !== undefined) {
      if (coupon.timesRedeemed >= coupon.maxRedemptions) {
        return NextResponse.json({ error: 'This coupon has been fully redeemed.' }, { status: 400 });
      }
    }

    // Check if user already redeemed this coupon
    const existingRedemption = await adminDb
      .collection('couponRedemptions')
      .where('couponId', '==', couponDoc.id)
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!existingRedemption.empty) {
      return NextResponse.json({ error: 'You have already used this coupon.' }, { status: 400 });
    }

    const fixesGranted = coupon.freeFixesGranted || 1;

    // Perform all writes in a batch
    const batch = adminDb.batch();

    // 1. Create redemption record
    const redemptionRef = adminDb.collection('couponRedemptions').doc();
    batch.set(redemptionRef, {
      couponId: couponDoc.id,
      userId: uid,
      redeemedAt: FieldValue.serverTimestamp(),
    });

    // 2. Increment coupon times redeemed
    batch.update(couponDoc.ref, {
      timesRedeemed: FieldValue.increment(1),
    });

    // 3. Credit user's fixes
    batch.update(adminDb.collection('users').doc(uid), {
      fixesRemaining: FieldValue.increment(fixesGranted),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      fixesGranted,
      message: `${fixesGranted} fix${fixesGranted === 1 ? '' : 'es'} added to your account!`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
