'use client';

import { useEffect } from 'react';
import { useTheme } from '@magicwrx/theme-manager';

/**
 * PixThemeInit — mounts in the root layout and sets the 'pix' app skin.
 * Renders nothing; side-effect only.
 */
export function PixThemeInit() {
  const { setAppSkin } = useTheme();

  useEffect(() => {
    setAppSkin('pix');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
