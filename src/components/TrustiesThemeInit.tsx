'use client';

import { useDynamicTheme } from '@magicwrxtools/theme-manager';

export function TrustiesThemeInit() {
  useDynamicTheme('trusties', {
    supabaseUrl: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY,
  });
  return null;
}
