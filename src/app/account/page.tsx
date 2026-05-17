'use client';

import { useEffect, useState } from 'react';
import { Shield, User, CreditCard, FileText, Coins, Zap, History, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

interface TokenData {
  tokens: number;
  totalPurchased: number;
  totalSpent: number;
  userId: string;
}

interface Purchase {
  id: string;
  amount_usd: number;
  tokens: number;
  created_at: string;
  status: string;
}

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    // Fetch token balance
    fetch('/api/tokens/balance')
      .then((r) => r.json())
      .then((data) => {
        if (data.tokens !== undefined) {
          setTokenData(data);
        }
        setLoadingTokens(false);
      })
      .catch(() => setLoadingTokens(false));

    // Fetch purchase history
    fetch('/api/tokens/purchases')
      .then((r) => r.json())
      .then((data) => {
        setPurchases(data.purchases ?? []);
        setLoadingPurchases(false);
      })
      .catch(() => setLoadingPurchases(false));
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded mx-auto" />
          <div className="h-4 w-64 bg-muted rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to access your account.</p>
        <Button><Link href="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Account</h1>

        {/* Token Balance Hero */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Token Balance</span>
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {loadingTokens ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <>{tokenData?.tokens ?? 0}</>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {tokenData
                    ? `${tokenData.totalPurchased.toLocaleString()} purchased · ${tokenData.totalSpent.toLocaleString()} spent`
                    : 'Loading stats...'}
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/chat">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="w-4 h-4 mr-1" /> Open Chat
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline">
                    <ShoppingCart className="w-4 h-4 mr-1" /> Buy Tokens
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="text-sm text-foreground">{user.email ?? 'Not set'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">User ID</span>
                <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 12)}...</p>
              </div>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Subscription</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Current Plan</span>
                <p className="text-sm text-foreground">Pay As You Go (Tokens)</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/pricing">
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-1" /> Buy Tokens
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" size="sm">
                    <Zap className="w-4 h-4 mr-1" /> AI Chat
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Documents</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Access your secure document vault.</p>
              <Button variant="outline" size="sm"><Link href="/vault">Open Vault</Link></Button>
            </CardContent>
          </Card>

          {/* Token Usage Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Token Usage</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTokens ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-semibold">{tokenData?.tokens ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Purchased</span>
                    <span className="font-semibold">{tokenData?.totalPurchased ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-semibold">{tokenData?.totalSpent ?? 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Purchase History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPurchases ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded" />
                ))}
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No purchases yet.</p>
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="mt-3">
                    Buy Your First Tokens
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Date</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Amount</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Tokens</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 text-right font-medium">
                          ${p.amount_usd?.toFixed(2) ?? '0.00'}
                        </td>
                        <td className="py-2 px-2 text-right">{p.tokens?.toLocaleString() ?? 0}</td>
                        <td className="py-2 px-2 text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
