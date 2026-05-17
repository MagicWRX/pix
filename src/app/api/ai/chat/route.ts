/**
 * POST /api/ai/chat
 *
 * Trusties AI chat endpoint.
 * 1. Deducts tokens from the user's balance
 * 2. Sends the message to the OpenClaw agent
 * 3. Returns the AI response
 *
 * Cost: 2 tokens per message
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@magicwrxtools/auth-tool';

const TOKEN_COST = 2;
const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL ?? 'https://ai.magicwrx.com';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? '';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Parse body
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message } = body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // 3. Check and deduct tokens
  const { data: tokensData, error: balanceError } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('id', userId)
    .maybeSingle();

  if (balanceError) {
    console.error('Token check error:', balanceError);
    return NextResponse.json({ error: 'Failed to verify token balance' }, { status: 500 });
  }

  const currentBalance = tokensData?.balance ?? 0;
  if (currentBalance < TOKEN_COST) {
    return NextResponse.json({
      error: 'Insufficient tokens',
      tokensRequired: TOKEN_COST,
      tokensAvailable: currentBalance,
    }, { status: 402 }); // 402 Payment Required
  }

  // Deduct tokens
  const { error: deductError } = await supabase
    .from('user_tokens')
    .update({
      balance: currentBalance - TOKEN_COST,
      total_spent: supabase.rpc ? undefined : (tokensData as any)?.total_spent ? (tokensData as any).total_spent + TOKEN_COST : TOKEN_COST,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (deductError) {
    console.error('Token deduction error:', deductError);
    // Try RPC fallback
    try {
      await supabase.rpc('spend_tokens', {
        p_user_id: userId,
        p_tokens: TOKEN_COST,
      });
    } catch (rpcErr) {
      console.error('RPC spend_tokens also failed:', rpcErr);
      return NextResponse.json({ error: 'Failed to deduct tokens' }, { status: 500 });
    }
  }

  // 4. Send to OpenClaw agent
  if (!OPENCLAW_TOKEN) {
    // No AI configured — return a helpful response
    return NextResponse.json({
      reply: `I'm a Trusties AI assistant. I can help with:\n\n• Understanding trusts and estate planning\n• Document preparation guidance\n• Beneficiary management\n\n_(Full AI backend coming soon)_`,
      tokensUsed: TOKEN_COST,
    });
  }

  try {
    const target = `agent:trusties:main`;

    const res = await fetch(`${OPENCLAW_URL}/api/sessions/${encodeURIComponent(target)}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `[Trusties Chat - User ${userId.slice(0, 8)}] ${message}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      // Refund tokens on failure
      try {
        await supabase
          .from('user_tokens')
          .update({
            balance: currentBalance, // restore
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch { /* ignore refund errors */ }

      return NextResponse.json({
        error: `AI service error: ${res.status}`,
        detail: text,
        tokensRefunded: TOKEN_COST,
      }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      reply: data.reply || data.message || data.response || 'I understand. Let me think about that...',
      tokensUsed: TOKEN_COST,
      tokensRemaining: currentBalance - TOKEN_COST,
    });
  } catch (err) {
    // Refund tokens on network error
    try {
      await supabase
        .from('user_tokens')
        .update({
          balance: currentBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch { /* ignore refund errors */ }

    return NextResponse.json({
      error: err instanceof Error ? err.message : 'AI service unavailable',
      tokensRefunded: TOKEN_COST,
    }, { status: 502 });
  }
}
