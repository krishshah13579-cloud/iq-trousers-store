"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import InactivityWatcher from "@/components/auth/InactivityWatcher";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={2 * 60} refetchOnWindowFocus={true}>
      <CartProvider>
        <WishlistProvider>
          <InactivityWatcher />
          {children}
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
