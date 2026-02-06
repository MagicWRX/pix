import { siteConfig } from "./site"
import { Metadata } from "next"

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Next.js", "React", "Supabase", "Tailwind CSS"],
  authors: [
    {
      name: "MagicWRX",
      url: "https://magicwrx.com",
    },
  ],
  creator: "MagicWRX",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.jpg`],
    creator: "@magicwrx",
  },
}
