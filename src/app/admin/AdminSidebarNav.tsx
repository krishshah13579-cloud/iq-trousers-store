"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  ChevronLeft,
} from "lucide-react";

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
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="p-6 border-b border-gray-200">
          <Link
            href="/admin"
            className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
            <span>Admin Portal</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
          <span>Back to Store</span>
        </Link>
      </div>
    </div>
  );
}
