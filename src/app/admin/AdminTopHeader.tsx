"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface AdminTopHeaderProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export default function AdminTopHeader({
  onToggleMobileMenu,
  mobileMenuOpen,
}: AdminTopHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Compute breadcrumb title based on pathname
  const getPageTitle = () => {
    if (pathname === "/admin") return "Overview Dashboard";
    if (pathname.startsWith("/admin/products")) return "Product Catalog Management";
    if (pathname.startsWith("/admin/categories")) return "Trouser Categories";
    if (pathname.startsWith("/admin/orders")) return "Customer Orders & Fulfillment";
    if (pathname.startsWith("/admin/discounts")) return "Promo Codes & Discounts";
    if (pathname.startsWith("/admin/users")) return "Registered Customers";
    if (pathname.startsWith("/admin/admins")) return "Administrative Access & Team";
    return "Control Center";
  };

  const userRole = (session?.user as { role?: string })?.role || "ADMIN";
  const userName = session?.user?.name || "Administrator";
  const userEmail = session?.user?.email || "";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200/90 shadow-2xs">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Mobile hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Admin Panel</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right: Security Badge, Storefront Link, Admin User Pill, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Security Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-800">
              2FA Secured
            </span>
          </div>

          {/* Admin User Info Pill */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1 bg-zinc-900 text-white rounded-full shadow-2xs">
            <div className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-bold text-xs uppercase">
              {userName.charAt(0) || "A"}
            </div>
            <div className="text-left">
              <span className="block text-xs font-semibold leading-tight max-w-[120px] truncate">
                {userName}
              </span>
              <span className="block text-[9px] font-bold text-amber-300 uppercase tracking-wider leading-none">
                {userRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
              </span>
            </div>
          </div>

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-lg transition-colors cursor-pointer"
            title="Sign out of Administrative Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
