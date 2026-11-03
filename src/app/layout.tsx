import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import StoreLayoutShell from "@/components/layout/StoreLayoutShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.iqtrousers.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IQ Trousers | Premium Men's Trousers & Chinos Direct from Manufacturer",
    template: "%s | IQ Trousers",
  },
  description:
    "Engineered trousers for precision, comfort, and durability. Buy men's formal trousers, everyday casual chinos, and winter trousers direct from IQ Trousers (Krish Clothing Co., Ahmedabad).",
  keywords: [
    "IQTROUSERS",
    "IQ Trousers",
    "iqtrousers",
    "iqtrousers.in",
    "IQ Trousers Ahmedabad",
    "Krish Clothing Co",
    "men's formal trousers",
    "men's casual trousers",
    "chinos online India",
    "trouser manufacturer Ahmedabad",
    "buy trousers online",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "IQ Trousers | Engineered Men's Trousers & Chinos",
    description:
      "Engineered trousers for precision, comfort, and durability. Direct from manufacturer (Krish Clothing Co., Ahmedabad).",
    url: SITE_URL,
    siteName: "IQ Trousers",
    images: [
      {
        url: "/iq-trousers-logo-card.jpg",
        width: 1200,
        height: 630,
        alt: "IQ Trousers - Krish Clothing Co.",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IQ Trousers | Premium Men's Trousers & Chinos",
    description: "Engineered trousers for precision, comfort, and durability.",
    images: ["/iq-trousers-logo-card.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  verification: {
    google: "googlebc7ed8e410865694",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IQ Trousers",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon-48.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "name": "IQ Trousers",
  "alternateName": ["IQTROUSERS", "IQ Trousers Ahmedabad", "Krish Clothing Co."],
  "url": SITE_URL,
  "logo": `${SITE_URL}/icon-512.png`,
  "image": `${SITE_URL}/iq-trousers-logo-card.jpg`,
  "description":
    "Engineered trousers for precision and comfort. Manufacturer and retailer of premium men's formal trousers and everyday casual chinos in Ahmedabad.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ahmedabad",
    "addressRegion": "Gujarat",
    "addressCountry": "IN",
  },
  "parentOrganization": {
    "@type": "Organization",
    "name": "Krish Clothing Co.",
    "url": SITE_URL,
  },
  "sameAs": [
    "https://www.instagram.com/iqtrousers",
  ],
  "priceRange": "₹₹",
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "IQ Trousers",
  "alternateName": "IQTROUSERS",
  "url": SITE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${SITE_URL}/products?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="IQ Trousers" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white" suppressHydrationWarning>
        <Providers>
          <StoreLayoutShell>{children}</StoreLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
