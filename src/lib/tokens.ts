/**
 * Token pricing model for Trusties.uk
 *
 * 1 token = 1 message (user-friendly unit)
 * Messages average ~2 AI tokens each (input + output)
 * Provider cost: ~$0.00000136/message (DeepSeek)
 * 
 * Every tier is profitable at 99%+ margin.
 */

export interface TokenTier {
  usd: number;
  /** Number of messages (user-friendly unit) */
  messages: number;
  /** Actual AI tokens (approximately) */
  aiTokens: number;
  costPerMessage: number;
  label: string;
}

const MSG_COST = 0.00000136; // Our true cost per message

export function calculateTiers(): TokenTier[] {
  return [
    { usd: 1, messages: 50, aiTokens: 100, costPerMessage: 0.0200, label: 'Starter' },
    { usd: 2, messages: 100, aiTokens: 200, costPerMessage: 0.0200, label: 'Basic' },
    { usd: 5, messages: 500, aiTokens: 1000, costPerMessage: 0.0100, label: 'Value' },
    { usd: 7, messages: 750, aiTokens: 1500, costPerMessage: 0.0093, label: 'Standard' },
    { usd: 10, messages: 1200, aiTokens: 2400, costPerMessage: 0.0083, label: 'Popular' },
    { usd: 15, messages: 2000, aiTokens: 4000, costPerMessage: 0.0075, label: 'Generous' },
    { usd: 20, messages: 3000, aiTokens: 6000, costPerMessage: 0.0067, label: 'Power' },
    { usd: 35, messages: 6000, aiTokens: 12000, costPerMessage: 0.0058, label: 'Premium' },
    { usd: 50, messages: 10000, aiTokens: 20000, costPerMessage: 0.0050, label: 'Pro' },
    { usd: 75, messages: 17000, aiTokens: 34000, costPerMessage: 0.0044, label: 'Business' },
    { usd: 100, messages: 25000, aiTokens: 50000, costPerMessage: 0.0040, label: 'Enterprise' },
  ];
}

/**
 * Calculate messages for a custom dollar amount
 */
export function calculateTokensForAmount(usd: number): number {
  if (usd <= 0) return 0;
  const tiers = calculateTiers();
  
  if (usd >= 100) return Math.floor(usd * 250); // 250 msgs per $1 at $100 tier
  // Interpolate best rate for amounts between tiers
  let bestRate = 0.0040; // Best tier rate
  for (const t of tiers) {
    if (usd >= t.usd) bestRate = t.costPerMessage;
  }
  return Math.floor(usd / bestRate);
}

export function getTokenRateForAmount(usd: number): number {
  if (usd >= 75) return 0.0044;
  if (usd >= 35) return 0.0058;
  if (usd >= 10) return 0.0083;
  if (usd >= 5) return 0.010;
  return 0.020;
}

/**
 * True cost to us for a given number of messages (DeepSeek)
 */
export function providerCost(messages: number): number {
  return messages * MSG_COST;
}

/**
 * Profit margin — always 99%+
 */
export function profitMargin(usd: number, messages: number): number {
  const cost = providerCost(messages);
  return Math.round(((usd - cost) / usd) * 100);
}
