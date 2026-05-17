import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@magicwrxtools/auth-tool';

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events. 
 * On checkout.session.completed, credits tokens to the user's account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    const Stripe = require('stripe');
    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SANDBOX_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SANDBOX_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      console.error('Stripe webhook: missing configuration');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};

        // Only process token purchases
        if (metadata.type !== 'token_purchase') {
          console.log(`Webhook: ignoring non-token session ${session.id}`);
          break;
        }

        const userId = metadata.userId;
        const tokens = parseInt(metadata.tokens, 10);
        const amountUsd = parseFloat(metadata.amountUsd || '0');

        if (!userId || !tokens) {
          console.error('Webhook: missing userId or tokens in metadata', metadata);
          break;
        }

        console.log(`Webhook: crediting ${tokens} tokens to user ${userId} ($${amountUsd})`);

        // Credit tokens to user in Supabase
        const supabase = createClient();

        // Upsert the user_tokens row
        const { error: upsertError } = await supabase.rpc('credit_tokens', {
          p_user_id: userId,
          p_tokens: tokens,
        });

        if (upsertError) {
          // Fallback: try direct upsert
          console.error('Webhook: rpc credit_tokens failed, trying direct upsert', upsertError);

          // First check if row exists
          const { data: existing } = await supabase
            .from('user_tokens')
            .select('id, balance')
            .eq('id', userId)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('user_tokens')
              .update({
                balance: (existing.balance ?? 0) + tokens,
                total_purchased: (existing.total_purchased ?? 0) + tokens,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          } else {
            await supabase
              .from('user_tokens')
              .insert({
                id: userId,
                balance: tokens,
                total_purchased: tokens,
                total_spent: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }
        }

        // Record the purchase in token_purchases
        const { error: insertError } = await supabase
          .from('token_purchases')
          .insert({
            user_id: userId,
            amount_usd: amountUsd,
            tokens: tokens,
            stripe_session_id: session.id,
            status: 'completed',
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Webhook: failed to record purchase', insertError);
        }

        break;
      }

      case 'checkout.session.expired':
        console.log(`Webhook: session ${event.data.object.id} expired`);
        break;

      default:
        console.log(`Webhook: unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
