import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const snap = await adminDb
      .collection('payments')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const payments = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        // Fetch user email for display
        let userEmail = '';
        try {
          const userDoc = await adminDb.collection('users').doc(data.userId).get();
          userEmail = userDoc.data()?.email || '';
        } catch {
          // ignore
        }

        return {
          id: doc.id,
          ...data,
          userEmail,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        };
      })
    );

    return NextResponse.json({ payments });
  } catch (error) {
    return handleAuthError(error);
  }
}
