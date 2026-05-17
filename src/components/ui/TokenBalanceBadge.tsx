'use client';

import { Coins } from 'lucide-react';

/**
 * TokenBalanceBadge — shows the user's current token count.
 * Fetches from /api/tokens/balance on mount.
 */
export function TokenBalanceBadge() {
  // TODO: Wire to /api/tokens/balance once token DB is set up
  const tokens = 0;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200">
      <Coins className="w-3.5 h-3.5" />
      <span>{tokens} tokens</span>
    </div>
  );
}
