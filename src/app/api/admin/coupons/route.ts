import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const snap = await adminDb.collection('couponCodes').orderBy('createdAt', 'desc').limit(100).get();
    const coupons = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ coupons });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAdmin(request);

    const body = await request.json();
    const { code, freeFixesGranted, maxRedemptions, expiresAt } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existing = await adminDb
      .collection('couponCodes')
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 400 });
    }

    const couponData: Record<string, unknown> = {
      code: normalizedCode,
      freeFixesGranted: freeFixesGranted || 1,
      maxRedemptions: maxRedemptions || null,
      timesRedeemed: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: uid,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('couponCodes').add(couponData);

    return NextResponse.json({ id: docRef.id, code: normalizedCode });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { couponId, isActive } = body;

    if (!couponId) {
      return NextResponse.json({ error: 'couponId is required' }, { status: 400 });
    }

    await adminDb.collection('couponCodes').doc(couponId).update({
      isActive: !!isActive,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
