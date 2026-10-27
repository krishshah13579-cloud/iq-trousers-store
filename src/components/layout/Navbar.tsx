"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/clientLogout";
import {
  ShoppingCart,
  User,
  Search,
  Package,
  LogOut,
  LayoutDashboard,
  Heart,
  Ruler,
  ShieldCheck,
} from "lucide-react";

export default function Navbar() {
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(
        searchQuery.trim()
      )}`;
      setSearchQuery("");
    }
  };

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img
              src="/iq-trousers-logo-transparent.png"
              alt="IQ Trousers"
              width={40}
              height={48}
              loading="eager"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-950 font-sans uppercase leading-none">
                IQ Trousers
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden desktop-header-nav lg:flex items-center space-x-7">
            <Link
              href="/products"
              className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
            >
              Shop All
            </Link>
            <Link
              href="/size-guide"
              className="text-gray-700 hover:text-black transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <span>Size Guide</span>
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
            >
              Contact Us
            </Link>
          </div>

          {/* Search + Action Buttons */}
          <div className="hidden desktop-header-nav lg:flex items-center space-x-5">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search trousers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-56 pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </form>

            {/* Wishlist */}
            <Link
              href={session ? "/wishlist" : "/login"}
              className="relative p-2 text-gray-700 hover:text-black transition-colors flex items-center gap-1 text-sm font-medium"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-gray-700" />
              {session && totalWishlist > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalWishlist}
                </span>
              )}
              <span className="hidden xl:inline text-xs">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
              href={session ? "/cart" : "/login"}
              className="relative p-2 text-gray-700 hover:text-black transition-colors flex items-center gap-1.5 text-sm font-medium"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {session && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <span className="text-xs font-semibold">Cart</span>
            </Link>

            {/* Direct Admin Panel shortcut for administrators */}
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-1.5">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
                  title="Go to Admin Panel"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Panel</span>
                </Link>
              </div>
            )}

            {/* Login / Sign Up or Account Menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 text-gray-700 hover:text-black transition-colors rounded-full border border-gray-200 pl-3 pr-2"
                >
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {session.user?.name || "Account"}
                  </span>
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20">
                      <Link
                        href="/orders"
                        className="flex items-center space-x-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>My Orders</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          performLogout("/");
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login / Sign Up</span>
              </Link>
            )}
          </div>

          {/* Mobile & Tablet Portrait Header: Searchbar only (no toggle, cart, or wishlist) */}
          <div className="hidden mobile-header-nav flex-1 max-w-[240px] sm:max-w-xs md:max-w-sm ml-3">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search trousers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-2xs"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
