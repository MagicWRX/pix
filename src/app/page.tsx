'use client';

import { Shield, Lock, FileText, Users, Coins, Sparkles, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const icons = [Shield, Lock, FileText, Users];
  const tokenFeatures = [
    { icon: Coins, title: 'Watch Ads, Earn Tokens', desc: 'Short 5-15 second ads earn you tokens. No credit card needed.' },
    { icon: Eye, title: 'Unlock Premium Features', desc: 'Spend tokens on document vault access, chat sessions, and more.' },
    { icon: Sparkles, title: 'Or Buy Directly', desc: '£1 = 50 tokens. Skip the ads if you prefer.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Coins className="w-4 h-4" /> Free Forever
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            {siteConfig.tagline}
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Free forever. Watch a short ad or buy tokens to unlock premium features.
            No subscription pressure. No hidden fees.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-blue-400 text-blue-200 px-8 py-3 text-lg rounded-xl">
                See Token Prices
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Token Economy */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How Tokens Work</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">No subscription. No commitment. Just use what you need.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {tokenFeatures.map((f, i) => (
              <Card key={i} className="border-blue-100 hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <f.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What You Get</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteConfig.features.map((feature, i) => {
              const IconComponent = icons[i];
              return (
                <Card key={i} className="border-blue-100 hover:border-blue-300 transition-shadow hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      {IconComponent && <IconComponent className="h-6 w-6 text-blue-600" />}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Summary */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Transparent Token Pricing</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Everything is free to start. Premium features cost tokens.</p>
          <div className="max-w-lg mx-auto space-y-4">
            {[
              { action: 'Base service', cost: 'FREE' },
              { action: 'Watch one ad', cost: '+1 token' },
              { action: 'Document vault access (per doc)', cost: '3 tokens' },
              { action: 'AI chat session', cost: '2 tokens' },
              { action: 'Priority response', cost: '5 tokens' },
              { action: 'Monthly summary report', cost: '10 tokens' },
              { action: 'Direct token purchase', cost: '£1 = 50 tokens' },
              { action: 'Unlimited month (coming soon)', cost: '£9/mo' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-gray-800">{item.action}</span>
                <span className={`font-semibold ${item.cost === 'FREE' ? 'text-green-600' : 'text-blue-600'}`}>{item.cost}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl">
                Start Free — No Card Needed
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
