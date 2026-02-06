'use client';

import { useEffect } from 'react';
import { ThemeManager } from '@magicwrx/theme-manager';

export default function ThemeProvider() {
  useEffect(() => {
    const themeManager = ThemeManager.getInstance();
    themeManager.applyTheme('pix', 'dark'); // Apply pix theme in dark mode
  }, []);

  return null;
}