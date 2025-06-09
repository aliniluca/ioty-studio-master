import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a robust default, Geist can also be kept.
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster"
import { NotificationBell } from '@/components/shared/NotificationBell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ioty.ro - Tărâmul Inovației Artizanale!',
  description: 'Descoperă creații unice, unde tehnologia întâlnește măiestria, de la artizani inovatori din Estul Europei. Aici, fiecare obiect poartă o scânteie de viitor!',
  // Add more metadata like icons, open graph tags later
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <div className="absolute top-4 right-8 z-50">
            <NotificationBell />
          </div>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
