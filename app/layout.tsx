import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a robust default, Geist can also be kept.
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster"
import { NotificationBellGate } from '@/components/shared/NotificationBellGate';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: 'ioty.ro - Tărâmul Inovației Artizanale!',
  description: 'Descoperă creații unice, unde tehnologia întâlnește măiestria, de la artizani inovatori din Estul Europei. Aici, fiecare obiect poartă o scânteie de viitor!',
  keywords: 'artizanat, meșteșuguri, creații unice, tehnologie, inovație, România',
  authors: [{ name: 'ioty.ro' }],
  creator: 'ioty.ro',
  publisher: 'ioty.ro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ioty.ro'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ioty.ro - Tărâmul Inovației Artizanale!',
    description: 'Descoperă creații unice, unde tehnologia întâlnește măiestria, de la artizani inovatori din Estul Europei.',
    url: 'https://ioty.ro',
    siteName: 'ioty.ro',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ioty.ro - Tărâmul Inovației Artizanale!',
    description: 'Descoperă creații unice, unde tehnologia întâlnește măiestria.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://picsum.photos" />
        <link rel="preconnect" href="https://placehold.co" />
        
        {/* DNS prefetch for Firebase */}
        <link rel="dns-prefetch" href="//firestore.googleapis.com" />
        <link rel="dns-prefetch" href="//identitytoolkit.googleapis.com" />
        
        {/* Viewport meta tag for mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ioty.ro" />
        
        {/* Performance hints */}
        <link rel="preload" href="/api/health" as="fetch" crossOrigin="anonymous" />
        
        {/* Fix for simulateUserLogout error - immediate definition */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Immediate fix for simulateUserLogout error
              window.simulateUserLogout = function() {
                console.log('simulateUserLogout called - this is a development function');
                // This function is only for development purposes
              };
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <div className="absolute top-4 right-8 z-50">
            <Suspense fallback={<div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />}>
              <NotificationBellGate />
            </Suspense>
          </div>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
        
        {/* Fix for simulateUserLogout error - must be first */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Fix for simulateUserLogout error (development only)
              if (typeof window !== 'undefined') {
                window.simulateUserLogout = function() {
                  console.log('simulateUserLogout called - this is a development function');
                  // This function is only for development purposes
                };
              }
            `,
          }}
        />
        
        {/* Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              if ('performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                      console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                      console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
                    }
                  }, 0);
                });
              }
              
              // Service Worker registration for PWA features
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
