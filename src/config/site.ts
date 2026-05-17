export const siteConfig = {
  name: 'Trusties',
  tagline: 'Your Digital Affairs, Crystal Clear',
  description: 'Trust is hard. We make it easy. Free forever — watch ads for tokens to unlock premium features.',
  url: 'https://trusties.uk',
  ogImage: '/og.png',
  links: {
    twitter: null,
    github: null,
  },
  tokenPricing: {
    adWatch: '+1 token per ad',
    documentAccess: '3 tokens',
    chatSession: '2 tokens',
    priorityResponse: '5 tokens',
    monthlyReport: '10 tokens',
    directBuy: '£1 = 50 tokens',
    unlimitedMonth: '£9/mo (coming soon)',
  },
  features: [
    { title: 'Digital Will & Estate Planning', description: 'Document your final wishes with AI assistance. 100% transparent, always in your control.' },
    { title: 'Power of Attorney Templates', description: 'Legally sound templates customized to your situation. No fine print, no surprises.' },
    { title: 'Secure Document Vault', description: 'Encrypted storage for your most important documents. Share with trusted parties on your terms.' },
    { title: 'Beneficiary Management', description: 'Who gets what, when, and how. Full transparency with role-based access control.' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
