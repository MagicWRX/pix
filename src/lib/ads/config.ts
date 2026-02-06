export type AdMode = 'none' | 'magicwrx-ads'

export interface AdsRuntimeConfig {
  mode: AdMode
  adsenseClient?: string
  adsenseSlot?: string
  requireConsent: boolean
  magicWrxUrl: string
  magicWrxCustomerId?: string
  magicWrxSiteId?: string
}

function normalizeAdMode(value: string | undefined): AdMode {
  const v = (value ?? '').trim().toLowerCase()
  if (v === 'none' || v === 'off' || v === 'disabled' || v === 'paid' || v === 'no-ads') return 'none'
  if (v === 'magicwrx-ads' || v === 'ads' || v === 'adsense') return 'magicwrx-ads'
  // Default: safe/no-ads unless explicitly enabled.
  return 'none'
}

function normalizeBool(value: string | undefined): boolean {
  const v = (value ?? '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export function getAdsRuntimeConfig(): AdsRuntimeConfig {
  const magicWrxUrl = process.env.NEXT_PUBLIC_MAGICWRX_URL ?? 'https://www.magicwrx.com'
  const mode = normalizeAdMode(process.env.NEXT_PUBLIC_AD_MODE)

  return {
    mode,
    adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
    adsenseSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT,
    requireConsent: normalizeBool(process.env.NEXT_PUBLIC_ADS_REQUIRE_CONSENT),
    magicWrxUrl,
    magicWrxCustomerId: process.env.NEXT_PUBLIC_MAGICWRX_CUSTOMER_ID,
    magicWrxSiteId: process.env.NEXT_PUBLIC_MAGICWRX_SITE_ID,
  }
}
