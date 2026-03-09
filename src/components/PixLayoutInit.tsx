'use client';

import { useEffect } from 'react';
import { useLayoutContract } from '@magicwrx/theme-manager';

/**
 * PixLayoutInit — mounts in the root layout and wires the DB-driven
 * layout contract for the 'pix' IP.
 *
 * Applies `--layout-grid-template` CSS variable to <html> when the contract
 * loads from ADMIN Supabase. Falls back silently (static layout) when DB unavailable.
 *
 * TASK-029 Step 8 — progressive layout enhancement.
 */
export function PixLayoutInit() {
  const { layout } = useLayoutContract('pix', {
    supabaseUrl: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY,
    defaultTemplate: 'pix-video-layout',
  });

  useEffect(() => {
    if (!layout?.gridTemplate) return;
    document.documentElement.style.setProperty(
      '--layout-grid-template',
      layout.gridTemplate,
    );
    document.documentElement.dataset.layoutContract = layout.templateName;
  }, [layout]);

  return null;
}
