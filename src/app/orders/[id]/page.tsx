import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, getOrderStatusColor, getProductCoverImage } from "@/lib/utils";
import { ShippingAddress } from "@/types";
import {
  CheckCircle2,
  Package,
  MapPin,
  ArrowRight,
  XCircle,
  Truck,
  Tag,
  CreditCard,
  Clock,
  RotateCcw,
} from "lucide-react";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { calculateShippingFee, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { fetchPayURefundStatus, PayURefundStatusResult } from "@/lib/payu";

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function parseAddress(shippingAddress: string): ShippingAddress | null {
  try {
    return JSON.parse(shippingAddress);
  } catch {
    return null;
  }
}

function getProductImage(images?: string | null): string {
  return getProductCoverImage(images);
}

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const paymentStatus = typeof query.payment === "string" ? query.payment : undefined;
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  let order = null;
  try {
    order = await prisma.order.findUnique({
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
  } catch (error) {
    console.error("Failed to query order details:", error);
    order = null;
  }

  if (!order) {
    notFound();
  }

  const shipping = parseAddress(order.shippingAddress);
  const shippingEmail = (shipping as { email?: string } | null)?.email?.toLowerCase()?.trim();

  // Security check: only order owner or admin can view
  if (!session) {
    redirect(`/login?callbackUrl=/orders/${id}`);
  }

  const currentUserId = (session.user as { id?: string })?.id;
  const currentUserEmail = session.user?.email?.toLowerCase().trim();
  const currentUserRole = (session.user as { role?: string })?.role;
  const isOwner =
    (currentUserId && order.userId === currentUserId) ||
    (currentUserEmail && order.user?.email?.toLowerCase().trim() === currentUserEmail) ||
    (currentUserEmail && shippingEmail && shippingEmail === currentUserEmail);
  const isAdmin = isAdminRole(currentUserRole);

  if (!isOwner && !isAdmin) {
    notFound();
  }
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const isCancelled = order.status === "CANCELLED";
  const isPrepaid = Boolean(order.paymentIntent && !order.paymentIntent.startsWith("COD") && order.total > 0);
  const refundMatch = order.paymentIntent?.match(/REFUND_INITIATED:([^|]+)/);
  const refundId = refundMatch ? refundMatch[1] : null;

  let liveRefundInfo: PayURefundStatusResult | null = null;
  if (isCancelled && isPrepaid) {
    const rawPaymentId = order.paymentIntent?.split("|")[0]?.trim();
    try {
      liveRefundInfo = await fetchPayURefundStatus({
        paymentId: rawPaymentId,
        refundId,
      });
    } catch (e) {
      console.warn("[ORDER PAGE] Live refund status fetch notice:", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Dynamic Status Banner */}
      <div className="text-center mb-8">
        {order.status === "CANCELLED" ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Your order has been cancelled.
            </h1>
          </div>
        ) : order.status === "DELIVERED" ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Order Delivered!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Your order has arrived. We hope you enjoy your new IQ Trousers!
            </p>
          </div>
        ) : order.status === "OUT_FOR_DELIVERY" ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-4">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Out For Delivery!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Your package is out with the delivery executive and will be delivered today.
            </p>
          </div>
        ) : order.status === "IN_TRANSIT" || order.status === "SHIPPED" ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Order In Transit!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Your package is on its way to your local delivery hub. Track shipment below.
            </p>
          </div>
        ) : order.status === "DISPATCHED" || order.status === "PROCESSING" ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Order Dispatched!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Your order has been packed and handed over to our logistics partner.
            </p>
          </div>
        ) : order.status === "CONFIRMED" ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Order Confirmed!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Thank you for your purchase. We&apos;ve verified your payment and are getting your trousers ready.
            </p>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Order Placed!
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Thank you for your order. We&apos;ve received your request and will confirm it shortly.
            </p>
          </div>
        )}
      </div>

      {/* PayU Payment Status Alert */}
      {paymentStatus === "success" && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">PayU Payment Completed Successfully!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your transaction has been securely authorized and verified. A confirmation email has been dispatched.
            </p>
          </div>
        </div>
      )}

      {paymentStatus === "failed" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm shadow-xs">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">PayU Payment Cancelled or Unsuccessful</p>
            <p className="text-xs text-red-700 mt-0.5">
              The payment was not completed. Reserved items have been automatically restocked, and your coupon (if any) is available again.
            </p>
          </div>
        </div>
      )}

      {/* Modern E-Commerce Live Order Timeline */}
      <div className="mb-8">
        <OrderTimeline
          status={order.status}
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
          trackingNumber={order.trackingNumber}
        />
      </div>

      {/* Prominent Refund Status Card for Cancelled Orders */}
      {isCancelled && (
        <div className="mb-8 bg-white border border-blue-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border-b border-blue-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900">Refund Status</h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      !isPrepaid
                        ? "text-neutral-700 bg-neutral-100"
                        : liveRefundInfo?.liveStatus === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-blue-700 bg-blue-100/90"
                    }`}
                  >
                    {liveRefundInfo?.liveStatus === "SUCCESS" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <Clock className="w-3 h-3 text-blue-700" />
                    )}
                    {isPrepaid
                      ? liveRefundInfo?.statusText || "100% Refund Initiated"
                      : "No Refund Needed"}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
                  {isPrepaid
                    ? `A full refund of ${formatPrice(order.total)} has been automatically initiated via PayU Payment Gateway${
                        liveRefundInfo?.isAvailable ? " (verified live with PayU)" : ""
                      }.`
                    : "This was a Cash on Delivery order. No payment was collected, so no refund is required."}
                </p>
              </div>
            </div>
            {isPrepaid && (
              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-400 uppercase tracking-wider block">Refund Amount</span>
                <span className="text-xl font-bold text-blue-900">{formatPrice(order.total)}</span>
              </div>
            )}
          </div>

          {isPrepaid && (
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/70 space-y-1">
                <span className="text-neutral-400 block font-medium">Refund Route</span>
                <span className="font-semibold text-neutral-900 flex items-center gap-1.5 text-xs">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Original Payment Method
                </span>
                <span className="text-[11px] text-neutral-500 block">Funds return directly to source bank / UPI / Card</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/70 space-y-1">
                <span className="text-neutral-400 block font-medium">Estimated Settlement</span>
                <span className="font-semibold text-neutral-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  5 to 7 Business Days
                </span>
                <span className="text-[11px] text-neutral-500 block">Subject to your issuing bank's clearing cycle</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/70 space-y-1">
                <span className="text-neutral-400 block font-medium">Refund Reference ID</span>
                <span className="font-mono font-semibold text-neutral-900 text-xs truncate block">
                  {refundId || order.paymentIntent?.split("|")[0] || order.id}
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  {liveRefundInfo?.bankRefNum
                    ? `Bank Ref: ${liveRefundInfo.bankRefNum}`
                    : "PayU Transaction / Refund Reference"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Payment</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {order.paymentIntent?.startsWith("PAYU")
                ? "PayU Online"
                : "PayU India"}
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

          {isCancelled && (
            <div>
              <span className="text-xs text-neutral-400 uppercase tracking-wider block">Refund Status</span>
              {isPrepaid ? (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    liveRefundInfo?.liveStatus === "SUCCESS"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      liveRefundInfo?.liveStatus === "SUCCESS"
                        ? "bg-emerald-600"
                        : "bg-blue-600 animate-pulse"
                    }`}
                  />
                  {liveRefundInfo?.statusText || `Refund Initiated (${formatPrice(order.total)})`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  N/A (Cash on Delivery)
                </span>
              )}
            </div>
          )}

          {order.trackingNumber && (
            <div>
              <span className="text-xs text-neutral-400 uppercase tracking-wider block">Tracking</span>
              <span className="font-mono text-xs font-medium text-neutral-700">
                {order.trackingNumber}
              </span>
            </div>
          )}

          {/* Cancellation Button for Pre-Fulfillment Orders */}
          {["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) && (
            <div className="ml-auto">
              <CancelOrderButton
                orderId={order.id}
                currentStatus={order.status}
                discountCode={order.discountCode}
                variant="button"
              />
            </div>
          )}
        </div>

        {/* Cancellation Notice Banner */}
        {["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) && (
          <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between gap-3 text-xs text-amber-900">
            <span>
              ⚡ <strong>Cancellation Eligible:</strong> You can cancel this order anytime before it is processed or shipped. Any applied coupon will be restored immediately.
            </span>
          </div>
        )}

        {order.status === "CANCELLED" && (
          <div className="px-6 py-3.5 bg-red-50/60 border-b border-red-100 text-xs text-red-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">Your order has been cancelled.</span>
          </div>
        )}

        {/* Items List */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-neutral-500" />
            <span>Items Ordered</span>
          </h2>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item) => {
              const imageUrl = getProductImage(item.product?.images);
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                      <Image
                        src={imageUrl}
                        alt={item.product?.name || "Product"}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {item.product?.name || "Product"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span>Qty: {item.quantity} × {formatPrice(item.price)}</span>
                        {item.size && (
                          <span className="font-semibold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] border border-neutral-200">
                            Size: {item.size}
                          </span>
                        )}
                      </div>
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
                {itemsSubtotal >= FREE_SHIPPING_THRESHOLD
                  ? "Free"
                  : formatPrice(
                      calculateShippingFee(
                        itemsSubtotal,
                        shipping?.state,
                        shipping?.zipCode
                      ).amount
                    )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax (5%)</span>
              <span className="font-medium text-neutral-900">
                {formatPrice(Math.round(itemsSubtotal * 0.05))}
              </span>
            </div>
            <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-neutral-900">Total Paid</span>
              <span className="text-lg font-bold text-neutral-900">
                {formatPrice(order.total)}
              </span>
            </div>
            {isCancelled && isPrepaid && (
              <div className="pt-2 flex justify-between items-baseline text-blue-700 font-semibold text-sm">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refund Initiated</span>
                </span>
                <span>{formatPrice(order.total)}</span>
              </div>
            )}
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
