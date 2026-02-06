'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'mw_ads_consent_v1'

type ConsentState = 'unknown' | 'granted' | 'denied'

function readConsent(): ConsentState {
  try {
    if (typeof document === 'undefined') return 'unknown'
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${STORAGE_KEY}=`)
    if (parts.length === 2) {
      const v = parts.pop()?.split(';').shift()
      if (v === 'granted' || v === 'denied') return v as ConsentState
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function writeConsent(value: Exclude<ConsentState, 'unknown'>) {
  try {
    const d = new Date()
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year
    document.cookie = `${STORAGE_KEY}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`
  } catch {
    // ignore
  }
}

export function useAdsConsent() {
  const [consent, setConsent] = useState<ConsentState>('unknown')

  useEffect(() => {
    setConsent(readConsent())
  }, [])

  return useMemo(
    () => ({
      consent,
      grant: () => {
        writeConsent('granted')
        setConsent('granted')
      },
      deny: () => {
        writeConsent('denied')
        setConsent('denied')
      },
    }),
    [consent],
  )
}

export default function AdConsentBanner() {
  const { consent, grant, deny } = useAdsConsent()

  if (consent !== 'unknown') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700">
          <p className="font-medium text-gray-900">Ads & privacy</p>
          <p>
            This site may use Google AdSense to show ads. You can accept or decline ad personalization.
            See our <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={deny}>Decline</Button>
          <Button onClick={grant}>Accept</Button>
        </div>
      </div>
    </div>
  )
}
