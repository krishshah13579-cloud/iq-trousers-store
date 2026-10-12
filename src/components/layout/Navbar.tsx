"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Package,
  LogOut,
  LayoutDashboard,
  Heart,
  Ruler,
} from "lucide-react";

export default function Navbar() {
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-serif font-black text-base tracking-wider">
                IQ
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-950 font-serif leading-none">
                IQ Trousers
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-sans mt-0.5">
                Krish Clothing Co.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
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
          <div className="hidden md:flex items-center space-x-5">
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
              href="/wishlist"
              className="relative p-2 text-gray-700 hover:text-black transition-colors flex items-center gap-1 text-sm font-medium"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-gray-700" />
              {totalWishlist > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalWishlist}
                </span>
              )}
              <span className="hidden xl:inline text-xs">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-black transition-colors flex items-center gap-1.5 text-sm font-medium"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <span className="text-xs font-semibold">Cart</span>
            </Link>

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
                      <Link
                        href="/wishlist"
                        className="flex items-center space-x-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>My Wishlist</span>
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
                        onClick={() => signOut()}
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

          {/* Mobile Menu Actions */}
          <div className="flex items-center space-x-3 lg:hidden">
            <Link href="/wishlist" className="relative p-2 text-gray-700">
              <Heart className="w-5 h-5" />
              {totalWishlist > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalWishlist}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative p-2 text-gray-700">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-700 hover:text-black"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-xl animate-fadeIn">
          <div className="px-4 py-3 border-b border-gray-100">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search trousers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-hidden"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>
          </div>
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/products"
              className="block px-3 py-2.5 text-gray-800 hover:text-black text-sm font-medium rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Shop All
            </Link>
            <Link
              href="/size-guide"
              className="block px-3 py-2.5 text-gray-800 hover:text-black text-sm font-medium rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Size Guide
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2.5 text-gray-800 hover:text-black text-sm font-medium rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2.5 text-gray-800 hover:text-black text-sm font-medium rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Contact Us
            </Link>
            <Link
              href="/wishlist"
              className="flex items-center justify-between px-3 py-2.5 text-gray-800 hover:text-black text-sm font-medium rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              <span>Wishlist</span>
              {totalWishlist > 0 && (
                <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {totalWishlist}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-between px-3 py-2.5 text-gray-800 hover:text-black text-sm font-medium rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            <div className="pt-3 border-t border-gray-100">
              {session ? (
                <>
                  <Link
                    href="/orders"
                    className="block px-3 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-3 py-2 text-rose-600 text-sm font-medium rounded-lg hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block text-center py-2.5 px-4 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
