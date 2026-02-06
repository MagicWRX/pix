'use client'

import Script from 'next/script'

export default function AdSenseScript({ client }: { client: string }) {
  // https://developers.google.com/publisher-tag/guides/get-started (AdSense uses the same googlesyndication host)
  // AdSense loader: https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=...
  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      crossOrigin="anonymous"
    />
  )
}
