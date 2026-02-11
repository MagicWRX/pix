import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdsRuntime from '@/components/ads/AdsRuntime';
import AuthProvider from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

// Dynamic Metadata
// In a real app, you might fetch this from a DB based on the hostname
export const metadata: Metadata = {
  title: {
    template: '%s | VideoHub',
    default: 'VideoHub - Community Video Platform',
  },
  description: 'Create, share, and discover amazing video content. Join our community of creators and viewers.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://videohub.example.com',
    siteName: 'VideoHub',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VideoHub Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VideoHub',
    description: 'Community Video Platform',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" data-theme-pref="dark" data-app="template">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <AdsRuntime />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
