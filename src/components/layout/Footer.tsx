"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 tracking-tight">Atelier Store</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Curated menswear and refined apparel. Timeless casual essentials and modern formalwear tailored for everyday life.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Collections</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  All Clothing
                </Link>
              </li>
              <li>
                <Link href="/products?category=casual-everyday" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Casual Everyday
                </Link>
              </li>
              <li>
                <Link href="/products?category=formal-wear" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Formal Wear
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-gray-500">help@store.com</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">1-800-STORE</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">Mon-Fri 9am-6pm EST</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-400">
            &copy; 2025 Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
