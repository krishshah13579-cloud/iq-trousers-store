"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Tag,
  Users,
  ShieldCheck,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface AdminSidebarNavProps {
  onItemClick?: () => void;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
    exact: false,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    exact: false,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    exact: false,
  },
  {
    name: "Discounts",
    href: "/admin/discounts",
    icon: Tag,
    exact: false,
  },
  {
    name: "Customers",
    href: "/admin/users",
    icon: Users,
    exact: false,
  },
  {
    name: "Admin Team",
    href: "/admin/admins",
    icon: ShieldCheck,
    exact: false,
  },
];

export default function AdminSidebarNav({ onItemClick }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = (session?.user as { role?: string })?.role || "ADMIN";
  const userName = session?.user?.name || "Administrator";
  const userEmail = session?.user?.email || "";

  return (
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <Link
            href="/admin"
            onClick={onItemClick}
            className="flex items-center gap-3 group"
          >
            <img
              src="/iq-trousers-logo-transparent.png"
              alt="IQ Trousers"
              className="h-7 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
            <div>
              <span className="block text-[11px] font-extrabold tracking-wider text-zinc-950 uppercase">
                Control Center
              </span>
              <span className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
                IQ Trousers
              </span>
            </div>
          </Link>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-amber-400 tracking-wider uppercase">
            Admin
          </span>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Management Options
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-amber-400" : "text-zinc-400 group-hover:text-zinc-950"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer User & Security Card */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        {/* User Card */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-gray-200/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {userName.charAt(0) || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-zinc-900 truncate">
                {userName}
              </span>
              <span className="block text-[10px] text-zinc-500 truncate">
                {userEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-[10px]">
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2FA Verified
            </span>
            <span className="font-bold uppercase tracking-wider text-zinc-500">
              {userRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        {/* View Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors border border-gray-200 cursor-pointer shadow-2xs"
          title="Open Customer Storefront in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          <span>View Storefront</span>
        </Link>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin" })}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/80 cursor-pointer shadow-2xs"
          title="Sign out of Admin Session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
