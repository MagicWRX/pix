'use client';

import { useDynamicTheme } from '@magicwrx/theme-manager';

/**
 * PixThemeInit — applies the 'pix' app skin immediately (static fallback)
 * then overlays DB token overrides once loaded.
 *
 * TASK-029 Step 12: upgraded from bare setAppSkin() to useDynamicTheme().
 */
export function PixThemeInit() {
  useDynamicTheme('pix', {
    supabaseUrl: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY,
  });

  return null;
}
