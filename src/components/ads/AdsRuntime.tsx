'use client'

import AdConsentBanner, { useAdsConsent } from '@/components/ads/AdConsentBanner'
import AdSenseScript from '@/components/ads/AdSenseScript'
import AdBanner from '@/components/ads/AdBanner'
import { adsConfig } from '@/config/ads'
import { useEffect, useState } from 'react'

export default function AdsRuntime() {
  const { consent } = useAdsConsent()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const canLoadAds =
    adsConfig.enabled &&
    !!adsConfig.googleAdSenseId &&
    (!adsConfig.consentRequired || consent === 'granted')

  return (
    <>
      {adsConfig.enabled && adsConfig.consentRequired ? <AdConsentBanner /> : null}
      {canLoadAds ? <AdSenseScript client={adsConfig.googleAdSenseId} /> : null}
      {canLoadAds && adsConfig.googleAdSenseSlot ? (
        <AdBanner client={adsConfig.googleAdSenseId} slot={adsConfig.googleAdSenseSlot} />
      ) : null}
    </>
  )
}
