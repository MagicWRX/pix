'use client';

import * as React from 'react';
import type { User } from '@supabase/supabase-js';

type AuthSubscription = {
  unsubscribe: () => void;
};

type AuthChangeCallback = (
  event: string,
  session: { user?: User } | null
) => void | Promise<void>;

type MagicwrxClient = {
  auth: {
    getSession: () => Promise<{ data: { session: { user?: User } | null } }>;
    onAuthStateChange: (callback: AuthChangeCallback) => {
      data: { subscription: AuthSubscription };
    };
    signOut: () => Promise<void>;
  };
};

export function createClient(): MagicwrxClient {
  // Stub fallback: lets the app build/run without GitHub Packages auth.
  // Returns "no session" and a no-op subscription.
  return {
    auth: {
      async getSession() {
        return { data: { session: null } };
      },
      onAuthStateChange(_callback: AuthChangeCallback) {
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signOut() {
        // no-op
      },
    },
  };
}

type AuthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function LoginButton(props: AuthButtonProps) {
  const { children, ...rest } = props;
  return (
    <button type="button" {...rest}>
      {children ?? 'Login'}
    </button>
  );
}

export function LogoutButton(props: AuthButtonProps) {
  const { children, ...rest } = props;
  return (
    <button type="button" {...rest}>
      {children ?? 'Logout'}
    </button>
  );
}
