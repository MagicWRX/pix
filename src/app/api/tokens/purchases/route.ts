import { NextResponse } from 'next/server';
import { createClient } from '@magicwrxtools/auth-tool';

/**
 * GET /api/tokens/purchases
 *
 * Returns the authenticated user's purchase history.
 *
 * Response:
 *   { purchases: Array<{ id, amount_usd, tokens, created_at, status }> }
 */
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: purchases, error } = await supabase
      .from('token_purchases')
      .select('id, amount_usd, tokens, created_at, status')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Purchase history query error:', error);
      return NextResponse.json({ purchases: [] });
    }

    return NextResponse.json({ purchases: purchases ?? [] });
  } catch (err) {
    console.error('Purchase history error:', err);
    return NextResponse.json({ purchases: [] });
  }
}
