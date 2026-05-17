'use client';

import { useState, useCallback } from 'react';
import { Coins, Check, Sparkles, Eye, Zap, Calculator, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { calculateTiers, calculateTokensForAmount, profitMargin } from '@/lib/tokens';

const tiers = calculateTiers();

function TokenTierCard({ tier, index }: { tier: (typeof tiers)[0]; index: number }) {
  const [buying, setBuying] = useState(false);
  const { user } = useAuth();

  const handleBuy = useCallback(async () => {
    setBuying(true);
    try {
      const res = await fetch('/api/tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: tier.usd }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Purchase failed');
      }
    } catch {
      alert('Failed to initiate purchase');
    }
    setBuying(false);
  }, [tier.usd]);

  const margin = profitMargin(tier.usd, tier.tokens);
  const isPopular = tier.label === 'Popular';

  return (
    <Card key={tier.label} className={`relative flex flex-col transition-all hover:shadow-lg ${isPopular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
          Best Value
        </div>
      )}
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Price & Tokens */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold">${tier.usd}</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{tier.tokens.toLocaleString()}</div>
          <div className="text-xs text-gray-500">tokens</div>
        </div>

        {/* Cost per token */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <TrendingDown className="w-3.5 h-3.5 text-green-500" />
          <span>${tier.costPerToken.toFixed(4)} / token</span>
          {index > 0 && (
            <span className="text-green-600 text-xs font-medium ml-1">
              {Math.round((1 - tier.costPerToken / tiers[0].costPerToken) * 100)}% off
            </span>
          )}
        </div>

        {/* Token badge */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{tier.label}</span>
          <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
            {isPopular ? 'Save 50%' : `${margin}% margin`}
          </span>
        </div>

        {/* Buy button */}
        {user ? (
          <Button
            onClick={handleBuy}
            disabled={buying}
            className={`w-full mt-auto ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            {buying ? 'Processing...' : `Buy $${tier.usd}`}
          </Button>
        ) : (
          <Link href="/signup" className="w-full mt-auto">
            <Button className="w-full">Sign Up to Buy</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const [customAmount, setCustomAmount] = useState<number>(25);
  const [customBuying, setCustomBuying] = useState(false);
  const { user } = useAuth();

  const customTokens = calculateTokensForAmount(customAmount);
  const customRate = customAmount > 0 ? (customAmount / customTokens).toFixed(4) : '0';

  const handleCustomBuy = useCallback(async () => {
    if (customAmount < 1 || customAmount > 1000) {
      alert('Amount must be between $1 and $1,000');
      return;
    }
    setCustomBuying(true);
    try {
      const res = await fetch('/api/tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAmount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Purchase failed');
      }
    } catch {
      alert('Failed to initiate purchase');
    }
    setCustomBuying(false);
  }, [customAmount]);

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Coins className="w-4 h-4" /> Pay Per Token
          </div>
          <h1 className="text-4xl font-bold mb-4">Token Pricing</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Buy tokens once. Use them as you go. No subscription, no commitment.
            The more you buy, the less each token costs.
          </p>
        </div>

        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-16">
          {tiers.map((tier, i) => (
            <TokenTierCard key={tier.usd} tier={tier} index={i} />
          ))}
        </div>

        {/* Custom Token Calculator */}
        <Card className="max-w-lg mx-auto border-blue-200 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Custom Amount</h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Enter any amount from $1 to $1,000. Tokens are calculated at the best available rate.
            </p>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your investment
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                />
              </div>
              <input
                type="range"
                min={1}
                max={1000}
                step={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(parseInt(e.target.value))}
                className="w-full mt-3 accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>$1</span>
                <span>$500</span>
                <span>$1,000</span>
              </div>
            </div>

            {/* Token Calculation */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">You Get</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {customTokens.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">tokens</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Rate</div>
                  <div className="text-2xl font-bold text-green-700">
                    ${customRate}
                  </div>
                  <div className="text-xs text-gray-500">per token</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span>
                    Save {Math.round((1 - customAmount / customTokens / 0.02) * 100)}% vs Starter pack
                    {customAmount >= 100 && ' — best rate!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Buy Button */}
            {user ? (
              <Button
                onClick={handleCustomBuy}
                disabled={customBuying || customAmount < 1}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                size="lg"
              >
                {customBuying
                  ? 'Processing...'
                  : `Buy $${customAmount} — ${customTokens.toLocaleString()} Tokens`}
              </Button>
            ) : (
              <Link href="/signup">
                <Button className="w-full text-lg py-3" size="lg">
                  Sign Up to Purchase
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* What Tokens Unlock */}
        <div className="mt-16 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">What Tokens Unlock</h2>
          <div className="space-y-3">
            {[
              { icon: Eye, item: 'Document vault access', cost: '3 tokens' },
              { icon: Zap, item: 'AI chat session', cost: '2 tokens' },
              { icon: Sparkles, item: 'Priority response', cost: '5 tokens' },
              { icon: Coins, item: 'Monthly summary report', cost: '10 tokens' },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <t.icon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">{t.item}</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{t.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🔷 TRANSPARENCY SECTION */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Eye className="w-4 h-4" /> Radical Transparency
            </div>
            <h2 className="text-2xl font-bold">Where Your Money Goes</h2>
            <p className="text-gray-600 mt-2">
              We believe in complete transparency. Here&apos;s exactly how every dollar is spent.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 bg-gray-50 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div>Your Purchase</div>
              <div>Tokens</div>
              <div>Our Cost*</div>
              <div>Our Margin</div>
              <div>You Save**</div>
            </div>

            {/* Table Rows */}
            {tiers.map((tier, i) => {
              const margin = profitMargin(tier.usd, tier.tokens);
              const cost = providerCost(tier.tokens);
              const savingsVsStarter = i === 0
                ? '-'
                : `$${(tier.usd - (tiers[0].costPerToken * tier.tokens)).toFixed(2)}`;
              return (
                <div
                  key={tier.usd}
                  className={`grid grid-cols-5 gap-4 px-6 py-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${tier.label === 'Popular' ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}
                >
                  <div className="font-medium text-gray-900">${tier.usd}</div>
                  <div className="text-gray-700">{tier.tokens.toLocaleString()}</div>
                  <div className="text-gray-500">${cost.toFixed(4)}</div>
                  <div className="font-medium">
                    <span className={margin >= 95 ? 'text-green-600' : margin >= 90 ? 'text-amber-600' : 'text-blue-600'}>
                      {margin}%
                    </span>
                  </div>
                  <div className={`text-gray-500 ${savingsVsStarter !== '-' ? 'text-green-600 font-medium' : ''}`}>
                    {savingsVsStarter}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-2 text-xs text-gray-500">
              <p>
                * <strong>Our Cost</strong> is what we pay the AI provider (DeepSeek) to generate responses.
                We run on ~{profitMargin(10, 1000)}% margin at the $10 tier and adjust bulk discounts so
                higher purchases get better rates while keeping the service sustainable.
              </p>
              <p>
                ** <strong>You Save</strong> shows how much less you pay compared to buying $1 Starter packs.
                Buying in bulk means lower overhead for us, and we pass those savings to you.
              </p>
              <p className="text-gray-400 italic">
                No hidden fees. No subscriptions. What you buy is yours to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
