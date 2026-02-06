import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdsRuntime from '@/components/ads/AdsRuntime';

const inter = Inter({ subsets: ['latin'] });

// Dynamic Metadata
// In a real app, you might fetch this from a DB based on the hostname
export const metadata: Metadata = {
  title: {
    template: '%s | Pix',
    default: 'Pix - Creative Pixel Art Platform',
  },
  description: 'Create stunning pixel art with our advanced tools and community features.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pix.example.com',
    siteName: 'Pix',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pix Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pix',
    description: 'Creative Pixel Art Platform',
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
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <AdsRuntime />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
