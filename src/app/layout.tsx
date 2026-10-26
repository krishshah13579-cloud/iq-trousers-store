import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import StoreLayoutShell from "@/components/layout/StoreLayoutShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#162082",
};

export const metadata: Metadata = {
  title: "IQ Trousers | Krish Clothing Co.",
  description:
    "Engineered trousers for precision and comfort. Explore Casual Everyday and Formal Wear tailored by Krish Clothing Co., Ahmedabad.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IQ Trousers",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="IQ Trousers" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col bg-white" suppressHydrationWarning>
        <Providers>
          <StoreLayoutShell>{children}</StoreLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
