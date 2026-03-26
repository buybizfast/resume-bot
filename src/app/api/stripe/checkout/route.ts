import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICING_TIERS, isValidTier } from '@/lib/stripe';
import { verifyAuth, handleAuthError } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await verifyAuth(request);
    const body = await request.json();

    const { tier } = body;
    if (!tier || !isValidTier(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Expected: single, triple, or bulk.' },
        { status: 400 }
      );
    }

    const tierConfig = PRICING_TIERS[tier];
    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: 'Stripe price not configured for this tier.' },
        { status: 500 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: uid,
        tier,
        fixesCount: String(tierConfig.fixes),
      },
      success_url: `${origin}/editor?payment=success`,
      cancel_url: `${origin}/editor?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[POST /api/stripe/checkout] Error:', error);
    if (error && typeof error === 'object' && 'status' in error) {
      return handleAuthError(error);
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
