import Stripe from 'stripe';

// Lazy initialization — only runs when first accessed at runtime
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PRICING_TIERS = {
  single: {
    fixes: 1,
    get priceId() { return process.env.STRIPE_PRICE_SINGLE || ''; },
    label: '1 Resume Fix',
  },
  triple: {
    fixes: 3,
    get priceId() { return process.env.STRIPE_PRICE_TRIPLE || ''; },
    label: '3 Resume Fixes',
  },
  bulk: {
    fixes: 10,
    get priceId() { return process.env.STRIPE_PRICE_BULK || ''; },
    label: '10 Resume Fixes',
  },
} as const;

export type TierId = keyof typeof PRICING_TIERS;

export function isValidTier(tier: string): tier is TierId {
  return tier in PRICING_TIERS;
}
