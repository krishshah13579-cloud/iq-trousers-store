"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function ShellInner({ children }: { children: React.ReactNode }) {
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

  // Standard storefront interface for customers and admins browsing the store
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

export default function StoreLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
      }
    >
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}
