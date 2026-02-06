export const adsConfig = {
  enabled: false, // Disabled by default as per gold standard
  googleAdSenseId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "",
  googleAdSenseSlot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT || "", // Optional slot for global banner
  consentRequired: true,
}
