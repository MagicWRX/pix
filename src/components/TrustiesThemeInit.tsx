'use client';

// Safely re-export theme-manager for Turbopack compatibility
// Turbopack has issues resolving @magicwrxtools/theme-manager even when installed
import { useEffect, useState } from 'react';

const THEME_VARS: Record<string, string> = {
  '--background': '#ffffff',
  '--foreground': '#0f172a',
  '--primary': '#2563eb',
  '--primary-foreground': '#ffffff',
  '--secondary': '#f1f5f9',
  '--muted': '#f8fafc',
  '--muted-foreground': '#64748b',
  '--accent': '#e2e8f0',
  '--card': '#ffffff',
  '--card-foreground': '#0f172a',
  '--border': '#e2e8f0',
  '--ring': '#93c5fd',
};

export function TrustiesThemeInit() {
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (applied) return;
    const root = document.documentElement;
    for (const [key, val] of Object.entries(THEME_VARS)) {
      root.style.setProperty(key, val);
    }
    setApplied(true);
  }, [applied]);

  return null;
}
