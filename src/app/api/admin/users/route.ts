import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getUserProfile, handleAuthError } from '@/lib/auth-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await verifyAuth(request);
    const profile = await getUserProfile(uid);
    if (!profile.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParam = request.nextUrl.searchParams.get('search') || '';
    let query = adminDb.collection('users').orderBy('createdAt', 'desc').limit(50);

    // If searching by email, use a different query
    if (searchParam) {
      query = adminDb
        .collection('users')
        .where('email', '>=', searchParam.toLowerCase())
        .where('email', '<=', searchParam.toLowerCase() + '\uf8ff')
        .limit(50);
    }

    const snap = await query.get();
    const users = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await verifyAuth(request);
    const profile = await getUserProfile(uid);
    if (!profile.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, fixesRemaining, isAdmin } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (typeof fixesRemaining === 'number' && fixesRemaining >= 0) {
      updates.fixesRemaining = fixesRemaining;
    }

    if (typeof isAdmin === 'boolean') {
      updates.isAdmin = isAdmin;
    }

    await adminDb.collection('users').doc(userId).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
