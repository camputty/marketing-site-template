import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/config/site";
import { baseMetadata, isSiteConfigured } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = baseMetadata();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const socialProfiles = Object.values(siteConfig.company.socials);
  return (
    <html
      lang={siteConfig.defaultLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 rounded-md bg-foreground px-4 py-3 text-sm font-semibold text-background focus:not-sr-only"
        >
          Skip to content
        </a>
        {isSiteConfigured() ? (
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.company.name,
              url: siteConfig.company.url,
              sameAs: socialProfiles.length > 0 ? socialProfiles : undefined,
            }}
          />
        ) : null}
        <SiteHeader />
        <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
