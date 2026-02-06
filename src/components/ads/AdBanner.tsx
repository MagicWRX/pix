'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export default function AdBanner({
  client,
  slot,
}: Readonly<{ client: string; slot?: string }>) {
  useEffect(() => {
    try {
      const w = globalThis as unknown as Window
        w.adsbygoogle ??= []
      w.adsbygoogle.push({})
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="w-full border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          {...(slot ? { 'data-ad-slot': slot } : {})}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <p className="mt-2 text-[11px] text-gray-500">Ads by MagicWRX</p>
      </div>
    </div>
  )
}
