"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobilePhoneNavbar from "@/components/layout/MobilePhoneNavbar";

export default function StoreLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  // In the admin panel, completely isolate and hide customer UI
  if (isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-900/5 text-zinc-900">
        {children}
      </div>
    );
  }

  // Standard storefront interface: Navbar renders immediately at the top
  return (
    <>
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobilePhoneNavbar />
    </>
  );
}
