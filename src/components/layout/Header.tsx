'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { LoginButton, LogoutButton } from '@magicwrx/auth-tool'
import { useAuth } from '@/components/auth/AuthProvider'
import { Upload, User, Search } from 'lucide-react'

function AuthButtons() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </Button>
        <LogoutButton />
      </div>
    );
  }

  return <LoginButton />;
}

export default function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          VideoHub
        </Link>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <AuthButtons />
      </div>
    </header>
  )
}
