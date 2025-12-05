// Stripe tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    maxPrints: 15,
    priceId: null,
    productId: null,
  },
  standard: {
    name: 'Standard',
    price: 5,
    maxPrints: 100,
    priceId: 'price_1SayFrGWxoGcsxrNaqqEMSKN',
    productId: 'prod_TY4OPxucZ3vZC8',
  },
  pro: {
    name: 'Pro',
    price: 10,
    maxPrints: 200,
    priceId: 'price_1SayG6GWxoGcsxrN9N3feOYc',
    productId: 'prod_TY4OlOLBv93GR7',
  },
} as const;

export type TierKey = keyof typeof SUBSCRIPTION_TIERS;

export function getTierByProductId(productId: string | null): TierKey {
  if (!productId) return 'free';
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.productId === productId) return key as TierKey;
  }
  return 'free';
}
