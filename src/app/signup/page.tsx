'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function SignupPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><Shield className="w-10 h-10 text-primary" /></div>
          <CardTitle className="text-2xl">Join Trusties</CardTitle>
          <CardDescription>Secure your digital affairs today</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action="/auth/callback" method="GET">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input id="name" name="name" type="text" placeholder="Your name" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input id="password" name="password" type="password" placeholder="Min. 8 characters" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already a member? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
