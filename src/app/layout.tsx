import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import { TrustiesThemeInit } from '@/components/TrustiesThemeInit';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    template: '%s | Trusties.uk',
    default: 'Trusties.uk — Your Digital Affairs, Crystal Clear',
  },
  description: 'Trust is hard. We make it easy. 100% transparent AI-assisted trust platform. Free forever, ads for tokens.',
  keywords: ['trust', 'will', 'estate planning', 'power of attorney', 'digital legacy'],
  openGraph: {
    title: 'Trusties.uk',
    description: 'Your Digital Affairs, Crystal Clear',
    url: 'https://trusties.uk',
    siteName: 'Trusties',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <TrustiesThemeInit />
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
