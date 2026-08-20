import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { RegionProvider } from '@/context/RegionContext';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Traditional Chinese gets a first-class typeface, not a fallback afterthought.
// Loaded with subsetting so only the characters actually used are shipped.
const notoSansTC = Noto_Sans_TC({
  variable: "--font-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MARKD — Track What You Watch",
  description:
    "Your personal movie & TV show tracker. Search, discover, and keep track of everything you watch.",
  keywords: ["movies", "tv shows", "tracker", "watchlist", "streaming"],
};

export const viewport: Viewport = {
  themeColor: "#0a0c11",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansTC.variable} antialiased`} suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-background focus:shadow-elevated"
        >
          Skip to content
        </a>
        <NextIntlClientProvider messages={messages}>
          <RegionProvider>
            <Navbar />
            <main id="main-content" className="min-h-screen pb-24 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </RegionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}