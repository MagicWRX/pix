'use client';

import Link from 'next/link';
import { Shield, User, FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState } from 'react';
import { LoginButton, LogoutButton } from '@magicwrxtools/auth-tool';
import { TokenBalanceBadge } from '@/components/ui/TokenBalanceBadge';

export default function Header() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/vault', label: 'Document Vault' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Shield className="w-6 h-6 text-primary" />
          Trusties
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <TokenBalanceBadge />
          {loading ? (
            <div className="w-20 h-8 bg-muted animate-pulse rounded" />
          ) : user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/account"><User className="w-4 h-4 mr-2" />Account</Link>
              </Button>
              <LogoutButton className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" />
            </>
          ) : (
            <LoginButton className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors" />
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                  <Link href="/account" onClick={() => setMobileOpen(false)}><User className="w-4 h-4 mr-2" />Account</Link>
                </Button>
                <LogoutButton className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent mt-1" />
              </>
            ) : (
              <Link href="/login" className="block w-full text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
