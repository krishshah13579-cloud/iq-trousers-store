import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  FolderTree,
  ShieldCheck,
  ArrowRight,
  Tag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, getOrderStatusColor } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    revenueResult,
    totalOrders,
    totalProducts,
    totalCustomers,
    totalAdmins,
    totalCategories,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
    prisma.category.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
      },
    }),
  ]);

  const totalRevenue = revenueResult._sum.total || 0;

  const statCards = [
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      description: "Excluding cancelled orders",
      color: "text-emerald-600 bg-emerald-50",
      href: "/admin/orders",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      description: "All customer purchases",
      color: "text-blue-600 bg-blue-50",
      href: "/admin/orders",
    },
    {
      title: "Products & Stock",
      value: totalProducts.toLocaleString(),
      icon: Package,
      description: "In inventory catalog",
      color: "text-indigo-600 bg-indigo-50",
      href: "/admin/products",
    },
    {
      title: "Registered Users",
      value: totalCustomers.toLocaleString(),
      icon: Users,
      description: "Active customer accounts",
      color: "text-amber-600 bg-amber-50",
      href: "/admin/users",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back. Here is what is happening across your IQ Trousers store today.
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs transition hover:shadow-md hover:border-gray-300 block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {card.value}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary Quick Action Cards (Categories, Admins, Discounts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          href="/admin/categories"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Categories
              </p>
              <p className="text-xs text-gray-500">
                {totalCategories} active collections
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/admin/admins"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Admin Users
              </p>
              <p className="text-xs text-gray-500">
                {totalAdmins} authorized administrator(s)
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/admin/discounts"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Discounts & Coupons
              </p>
              <p className="text-xs text-gray-500">
                Manage promotional codes
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing the latest 10 customer transactions
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-gray-900 hover:text-black flex items-center gap-1 group"
          >
            <span>View all orders</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No orders found yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-5 py-3">Order ID</th>
                  <th scope="col" className="px-5 py-3">Customer</th>
                  <th scope="col" className="px-5 py-3">Items</th>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3">Total</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const itemsCount = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-900">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">
                          {order.user?.name || "Guest Customer"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.user?.email || "No email"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {itemsCount} {itemsCount === 1 ? "item" : "items"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
