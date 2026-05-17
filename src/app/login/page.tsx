'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><Shield className="w-10 h-10 text-primary" /></div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Trusties account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action="/auth/callback" method="GET">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input id="password" name="password" type="password" placeholder="••••••••" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
