import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import StoreLayoutShell from "@/components/layout/StoreLayoutShell";

export const metadata: Metadata = {
  title: "IQ Trousers | Krish Clothing Co.",
  description:
    "Engineered trousers for precision and comfort. Explore Casual Everyday and Formal Wear tailored by Krish Clothing Co., Ahmedabad.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white" suppressHydrationWarning>
        <Providers>
          <StoreLayoutShell>{children}</StoreLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
