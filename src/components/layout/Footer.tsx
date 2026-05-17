import Link from 'next/link';
import { Shield, Heart, Scale, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-foreground">Trusties</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md text-sm">
              Your digital affairs, crystal clear. AI-assisted trust, will, estate, and document management — 100% transparent, always in your control.
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <Heart className="w-5 h-5" />
              <Scale className="w-5 h-5" />
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="/vault" className="text-sm text-muted-foreground hover:text-foreground">Document Vault</Link></li>
              <li><Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Trusties.uk — Made in the UK. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
