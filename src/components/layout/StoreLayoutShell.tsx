"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAdminRole } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isAdminRoute = pathname?.startsWith("/admin");
  const userRole = (session?.user as { role?: string })?.role;
  const isAdminUser = status === "authenticated" && isAdminRole(userRole);

  // If an administrator is logged in, never allow access to customer storefront
  useEffect(() => {
    if (isAdminUser && !isAdminRoute) {
      router.replace("/admin");
    }
  }, [isAdminUser, isAdminRoute, router]);

  // If an administrator is logged in and trying to view customer storefront, block UI
  if (isAdminUser && !isAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-300">
            Admin Session Active
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Redirecting to Admin Control Portal...
          </p>
        </div>
      </div>
    );
  }

  // In the admin panel, completely isolate and hide customer UI
  if (isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-900/5 text-zinc-900">
        {children}
      </div>
    );
  }

  // Standard storefront interface for customers
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
