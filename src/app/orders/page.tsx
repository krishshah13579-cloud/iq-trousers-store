import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { formatPrice, getOrderStatusColor } from "@/lib/utils";
import { Package, Calendar, ChevronRight, ArrowRight, ShoppingBag, Tag } from "lucide-react";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Orders — Store",
  description: "View and manage your previous orders.",
};

export default async function OrdersPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/orders");
  }

  let user = null;
  let orders: any[] = [];
  try {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user) {
      orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (error) {
    console.error("Failed to query user orders:", error);
  }

  if (!user && session?.user?.email) {
    redirect("/login?callbackUrl=/orders");
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Order History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Check the status of recent orders, view details, and track shipments.
          </p>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No orders found
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              You haven&apos;t placed any orders yet. Start exploring our catalog to find something you love.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const totalQuantity = (order.items || []).reduce(
                (sum: number, item: any) => sum + (item.quantity || 0),
                0
              );

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 transition-all"
                >
                  {/* Order Top Bar */}
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/40">
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider block font-medium">
                          Order Placed
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider block font-medium">
                          Total
                        </span>
                        <span className="font-semibold text-gray-900 block mt-0.5">
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider block font-medium">
                          Order Number
                        </span>
                        <span className="font-mono text-xs text-gray-600 block mt-1">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>

                      {order.status === "CANCELLED" && order.discountCode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          <span>Coupon Restored</span>
                        </span>
                      )}

                      {["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) && (
                        <CancelOrderButton
                          orderId={order.id}
                          currentStatus={order.status}
                          discountCode={order.discountCode}
                          variant="compact"
                        />
                      )}

                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors ml-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {(order.items || []).slice(0, 4).map((item: any) => {
                            let imageUrl = "/placeholder.png";
                            try {
                              const parsed = JSON.parse(item.product.images);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                imageUrl = parsed[0];
                              }
                            } catch {
                              if (item.product.images) {
                                imageUrl = item.product.images;
                              }
                            }

                            return (
                              <div
                                key={item.id}
                                className="w-14 h-14 rounded-xl border-2 border-white bg-gray-100 overflow-hidden relative flex-shrink-0 shadow-xs"
                              >
                                <img
                                  src={imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.items[0]?.product.name}
                            {order.items.length > 1 && (
                              <span className="text-gray-500 font-normal ml-1">
                                + {order.items.length - 1} more
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center sm:justify-end">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Track Order</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
