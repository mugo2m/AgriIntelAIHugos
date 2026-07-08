// app/layout.tsx
import { Toaster } from "sonner";
import type { Metadata, Viewport } from "next";
import { Mona_Sans } from "next/font/google";
import Navigation from "@/components/Navigation";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";
import I18nProvider from "@/components/I18nProvider";
import LanguageBar from "@/components/LanguageBar";
import { OfflineBanner } from "@/components/OfflineBanner"; // ✅ Add offline banner
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"; // ✅ Add service worker

import "./globals.css";
import "@/styles/mobile.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hugos",
  description: "An AI-powered platform for preparing for mock interviews",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "hugos",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#15803d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="hugos" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${monaSans.className} antialiased min-h-screen bg-gray-50 safe-top safe-bottom`}>
        <CurrencyProvider>
          <I18nProvider>
            <LanguageBar />
            <Navigation />
            <main className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 safe-bottom">
              {children}
            </main>
            <Toaster
              richColors
              position="top-center"
              toastOptions={{
                duration: 3000,
                className: "text-sm md:text-base",
              }}
            />
            {/* ✅ Offline Support Components */}
            <OfflineBanner />
            <ServiceWorkerRegistration />
          </I18nProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}