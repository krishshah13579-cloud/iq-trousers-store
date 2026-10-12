import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, getOrderStatusColor } from "@/lib/utils";
import { ShippingAddress } from "@/types";
import { CheckCircle2, Package, MapPin, ArrowRight } from "lucide-react";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

function parseAddress(shippingAddress: string): ShippingAddress | null {
  try {
    return JSON.parse(shippingAddress);
  } catch {
    return null;
  }
}

function getProductImage(images: string): string {
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === "string") return parsed;
  } catch {
    // string fallback
  }
  if (images && typeof images === "string") {
    return images.split(",")[0].trim();
  }
  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Security check: only order owner or admin can view
  const currentUserId = (session?.user as { id?: string })?.id;
  const currentUserRole = (session?.user as { role?: string })?.role;
  if (currentUserId && order.userId !== currentUserId && currentUserRole !== "ADMIN") {
    notFound();
  }

  const shipping = parseAddress(order.shippingAddress);
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Success banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Order Confirmed!
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Thank you for your purchase. We&apos;ve received your order and are getting it ready.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-neutral-200">
        {/* Order Header Meta */}
        <div className="p-6 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Order ID</span>
            <span className="font-mono text-sm font-semibold text-neutral-900">{order.id}</span>
          </div>

          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Date</span>
            <span className="text-sm text-neutral-700">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Status</span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getOrderStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          {order.trackingNumber && (
            <div>
              <span className="text-xs text-neutral-400 uppercase tracking-wider block">Tracking</span>
              <span className="font-mono text-xs font-medium text-neutral-700">
                {order.trackingNumber}
              </span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-neutral-500" />
            <span>Items Ordered</span>
          </h2>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item) => {
              const imageUrl = getProductImage(item.product.images);
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping and Totals */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50/20">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-500" />
              <span>Shipping Information</span>
            </h3>
            {shipping ? (
              <div className="text-sm text-neutral-600 space-y-1">
                <p className="font-medium text-neutral-900">{shipping.fullName}</p>
                <p>{shipping.address}</p>
                <p>
                  {shipping.city}, {shipping.state} {shipping.zipCode}
                </p>
                <p>{shipping.country}</p>
                <p className="text-xs text-neutral-500 mt-2">Phone: {shipping.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Address recorded on order</p>
            )}
          </div>

          <div className="space-y-2 text-sm text-neutral-600 border-t md:border-t-0 md:border-l md:pl-6 border-neutral-200 pt-4 md:pt-0">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Order Summary</h3>
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-medium text-neutral-900">{formatPrice(itemsSubtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount {order.discountCode ? `(${order.discountCode})` : ""}</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-medium text-neutral-900">
                {itemsSubtotal >= 100 ? "Free" : formatPrice(10)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax</span>
              <span className="font-medium text-neutral-900">
                {formatPrice(Math.round(itemsSubtotal * 0.08 * 100) / 100)}
              </span>
            </div>
            <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-neutral-900">Total Paid</span>
              <span className="text-lg font-bold text-neutral-900">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
