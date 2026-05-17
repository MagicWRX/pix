import { NextResponse } from 'next/server';
import { createClient } from '@magicwrxtools/auth-tool';

/**
 * GET /api/tokens/balance
 *
 * Returns the authenticated user's current token balance and usage stats.
 *
 * Response:
 *   { tokens: number, totalPurchased: number, totalSpent: number, userId: string }
 */
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ tokens: 0, error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Query actual token balance from Supabase user_credits or user_tokens table
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_tokens')
      .select('balance, total_purchased, total_spent')
      .eq('id', userId)
      .maybeSingle();

    if (tokensError) {
      console.error('Token balance query error:', tokensError);
    }

    if (tokensData) {
      return NextResponse.json({
        tokens: tokensData.balance ?? 0,
        totalPurchased: tokensData.total_purchased ?? 0,
        totalSpent: tokensData.total_spent ?? 0,
        userId,
      });
    }

    // Fallback if table doesn't exist yet — return 0
    return NextResponse.json({ tokens: 0, totalPurchased: 0, totalSpent: 0, userId });
  } catch (err) {
    console.error('Token balance error:', err);
    return NextResponse.json({ tokens: 0, error: 'Service unavailable' }, { status: 503 });
  }
}
