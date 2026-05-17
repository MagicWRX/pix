/**
 * Token pricing model for Trusties.uk
 *
 * Each purchase tier gives decreasing per-token cost (bulk discount).
 * Provider cost: ~$0.003/token (DeepSeek) → ~3-10x markup ensures profit on every token.
 *
 * All prices in USD (Stripe native currency). Future: may also show £ equivalents.
 */

export interface TokenTier {
  usd: number;
  tokens: number;
  costPerToken: number;
  label: string;
  /** Stripe price ID for this tier, or null for custom prices */
  stripePriceId: string | null;
}

export function calculateTiers(): TokenTier[] {
  return [
    { usd: 1, tokens: 50, costPerToken: 0.0200, label: 'Starter', stripePriceId: null },
    { usd: 2, tokens: 100, costPerToken: 0.0200, label: 'Basic', stripePriceId: null },
    { usd: 5, tokens: 350, costPerToken: 0.0143, label: 'Value', stripePriceId: null },
    { usd: 7, tokens: 500, costPerToken: 0.0140, label: 'Standard', stripePriceId: null },
    { usd: 10, tokens: 1000, costPerToken: 0.0100, label: 'Popular', stripePriceId: null },
    { usd: 15, tokens: 1500, costPerToken: 0.0100, label: 'Generous', stripePriceId: null },
    { usd: 20, tokens: 2000, costPerToken: 0.0100, label: 'Power', stripePriceId: null },
    { usd: 35, tokens: 5000, costPerToken: 0.0070, label: 'Premium', stripePriceId: null },
    { usd: 50, tokens: 7000, costPerToken: 0.0071, label: 'Pro', stripePriceId: null },
    { usd: 75, tokens: 15000, costPerToken: 0.0050, label: 'Business', stripePriceId: null },
    { usd: 100, tokens: 20000, costPerToken: 0.0050, label: 'Enterprise', stripePriceId: null },
  ];
}

/**
 * Calculate tokens for a custom dollar amount using piecewise pricing.
 * Tiers get cheaper as you spend more.
 */
export function calculateTokensForAmount(usd: number): number {
  if (usd <= 0) return 0;

  // Use interpolation-based pricing from the tiers
  const tiers = calculateTiers();

  // Sort descending by price
  const sorted = [...tiers].sort((a, b) => b.usd - a.usd);

  // If amount is >= $100, use the best rate ($0.005/token → 200 tokens per $1)
  if (usd >= 100) {
    return Math.floor(usd * 200); // 200 tokens per dollar at $0.005/token
  }

  // Find the tier just below this amount
  let prevTier = tiers[0]; // $1 / 50 token
  for (const tier of tiers) {
    if (tier.usd > usd) break;
    prevTier = tier;
  }

  // For amounts between tiers, interpolate between the current rate and the next rate
  const rate = prevTier.costPerToken;
  const tokensAtRate = Math.floor(usd / rate);
  return tokensAtRate;
}

/**
 * Get tokens per dollar discount bracket
 */
export function getTokenRateForAmount(usd: number): number {
  if (usd >= 75) return 0.005; // 200 per $
  if (usd >= 35) return 0.007; // ~143 per $
  if (usd >= 10) return 0.010; // 100 per $
  if (usd >= 5) return 0.014;  // ~71 per $
  return 0.020;                // 50 per $
}

/**
 * Cost to the provider for a given number of tokens (DeepSeek pricing)
 */
export function providerCost(tokens: number): number {
  return tokens * 0.003;
}

/**
 * Profit margin for a given purchase
 */
export function profitMargin(usd: number, tokens: number): number {
  const revenue = usd;
  const cost = providerCost(tokens);
  if (cost === 0) return 100;
  return Math.round(((revenue - cost) / revenue) * 100);
}
