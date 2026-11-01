"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import InactivityWatcher from "@/components/auth/InactivityWatcher";
import PwaUpdateManager from "@/components/pwa/PwaUpdateManager";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <CartProvider>
        <WishlistProvider>
          <InactivityWatcher />
          <PwaUpdateManager />
          {children}
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
