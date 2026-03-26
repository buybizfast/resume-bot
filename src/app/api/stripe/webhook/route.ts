import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, tier, fixesCount } = session.metadata || {};

    if (!userId || !fixesCount) {
      console.error('[Stripe Webhook] Missing metadata:', session.metadata);
      return NextResponse.json({ received: true });
    }

    const fixes = parseInt(fixesCount, 10);
    if (isNaN(fixes) || fixes <= 0) {
      console.error('[Stripe Webhook] Invalid fixesCount:', fixesCount);
      return NextResponse.json({ received: true });
    }

    try {
      // Idempotency check — don't double-credit
      const existingPayment = await adminDb
        .collection('payments')
        .where('stripeSessionId', '==', session.id)
        .limit(1)
        .get();

      if (!existingPayment.empty) {
        console.log('[Stripe Webhook] Payment already processed:', session.id);
        return NextResponse.json({ received: true });
      }

      // Create payment record
      await adminDb.collection('payments').add({
        userId,
        stripePaymentIntentId: session.payment_intent || '',
        stripeSessionId: session.id,
        amountCents: session.amount_total || 0,
        fixesPurchased: fixes,
        tier: tier || 'unknown',
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      // Credit the user's account
      await adminDb.collection('users').doc(userId).update({
        fixesRemaining: FieldValue.increment(fixes),
        totalPaidFixes: FieldValue.increment(fixes),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`[Stripe Webhook] Credited ${fixes} fixes to user ${userId}`);
    } catch (err) {
      console.error('[Stripe Webhook] Error processing payment:', err);
      // Return 200 to prevent Stripe retries causing duplicate credits
      return NextResponse.json({ received: true, error: 'Processing error logged' });
    }
  }

  return NextResponse.json({ received: true });
}
