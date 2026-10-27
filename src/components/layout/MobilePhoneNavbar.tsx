"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSession } from "next-auth/react";

export default function MobilePhoneNavbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { data: session } = useSession();

  // Don't show on admin routes or checkout
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Shop",
      href: "/products",
      icon: ShoppingBag,
      isActive: pathname?.startsWith("/products"),
    },
    {
      label: "Wishlist",
      href: session ? "/wishlist" : "/login",
      icon: Heart,
      badge: session && totalWishlist > 0 ? totalWishlist : null,
      isActive: pathname === "/wishlist",
    },
    {
      label: "Cart",
      href: session ? "/cart" : "/login",
      icon: ShoppingCart,
      badge: session && totalItems > 0 ? totalItems : null,
      isActive: pathname === "/cart",
    },
    {
      label: session ? "Account" : "Login",
      href: session ? "/orders" : "/login",
      icon: User,
      isActive: pathname === "/orders" || pathname === "/login",
    },
  ];

  return (
    <nav
      aria-label="Phone Navigation Bar"
      className="mobile-bottom-bar hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5"
    >
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
                item.isActive
                  ? "text-[#162082] font-bold"
                  : "text-gray-500 hover:text-gray-900 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    item.isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-[#162082]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
