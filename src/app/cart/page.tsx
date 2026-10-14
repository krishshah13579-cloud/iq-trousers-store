"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Truck,
  Sparkles,
  Check,
} from "lucide-react";

interface AppliedDiscount {
  id: string;
  code: string;
  type: string;
  value: number;
  maxDiscount?: number | null;
  amount: number;
  minOrder: number;
}

interface AvailableCoupon {
  id: string;
  code: string;
  type: string;
  value: number;
  maxDiscount?: number | null;
  minOrder: number;
  description: string;
  isPersonal: boolean;
  isFirstOrderCoupon: boolean;
  isEligible: boolean;
  shortfall: number;
  potentialSavings: number;
  daysLeft: number | null;
  salesPrompt: string;
  badge: string;
}

function getProductImage(images: string): string {
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === "string" && parsed.trim().length > 0) return parsed;
  } catch {
    // string fallback
  }
  if (images && typeof images === "string") {
    return images.split(",")[0].trim();
  }
  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
}

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, updateQuantity, removeItem, totalPrice, totalItems, isLoaded } = useCart();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cart");
    }
  }, [status, router]);

  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("activeDiscount");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [fetchingCoupons, setFetchingCoupons] = useState(false);

  // Financial calculations
  const subtotal = totalPrice;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shortfall = Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - subtotal) * 100) / 100);
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );
  // Estimated tax (5%) rounded off to nearest rupee
  const estimatedTax = Math.round(subtotal * 0.05);

  // Automatically remove applied coupon from selection if cart value is lower than minimum order value
  useEffect(() => {
    if (!isLoaded || status === "loading") return;

    if (appliedDiscount && (appliedDiscount.minOrder || 0) > 0 && subtotal < (appliedDiscount.minOrder || 0)) {
      const removedCode = appliedDiscount.code;
      const minReq = appliedDiscount.minOrder;
      setAppliedDiscount(null);
      sessionStorage.removeItem("activeDiscount");
      setDiscountSuccess(null);
      setDiscountError(
        `Coupon "${removedCode}" was automatically removed because your cart value (₹${subtotal.toLocaleString("en-IN")}) is lower than the minimum order value of ₹${minReq.toLocaleString("en-IN")}.`
      );
    }
  }, [subtotal, appliedDiscount, isLoaded, status]);

  // Recalculate discount amount based on current subtotal if percentage or fixed
  let currentDiscountAmount = 0;
  if (appliedDiscount && subtotal >= (appliedDiscount.minOrder || 0)) {
    if (appliedDiscount.type === "PERCENTAGE") {
      currentDiscountAmount = Math.round(((subtotal * appliedDiscount.value) / 100) * 100) / 100;
    } else {
      currentDiscountAmount = Math.min(appliedDiscount.value, subtotal);
    }
    if (appliedDiscount.maxDiscount && appliedDiscount.maxDiscount > 0) {
      currentDiscountAmount = Math.min(currentDiscountAmount, appliedDiscount.maxDiscount);
    }
  }

  // Total with round off amount included (rounded to nearest rupee without displaying a separate round-off line to user)
  const rawTotal = Math.max(0, subtotal - currentDiscountAmount + estimatedTax);
  const finalTotal = Math.round(rawTotal);

  // Fetch smart coupons available to this particular customer
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setFetchingCoupons(true);
    });

    fetch(`/api/discounts/available?cartTotal=${subtotal}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.coupons)) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setFetchingCoupons(false);
      });

    return () => {
      isMounted = false;
    };
  }, [subtotal]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(null);
    setDiscountSuccess(null);

    const code = discountCodeInput.trim();
    if (!code) {
      setDiscountError("Please enter a discount code");
      return;
    }

    setDiscountLoading(true);

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          orderTotal: subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setDiscountError(data.message || "Invalid discount code");
      } else {
        const discount: AppliedDiscount = data.discount;
        setAppliedDiscount(discount);
        sessionStorage.setItem("activeDiscount", JSON.stringify(discount));
        setDiscountSuccess(`Discount code "${discount.code}" applied successfully!`);
        setDiscountCodeInput("");
      }
    } catch (err) {
      console.error(err);
      setDiscountError("Failed to apply discount code. Please try again.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleApplySpecificCoupon = async (code: string) => {
    setDiscountLoading(true);
    setDiscountError(null);
    setDiscountSuccess(null);
    setDiscountCodeInput(code);

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          orderTotal: subtotal,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedDiscount(data.discount);
        sessionStorage.setItem("activeDiscount", JSON.stringify(data.discount));
        setDiscountSuccess(`Coupon "${data.discount.code}" applied successfully!`);
        setDiscountCodeInput("");
      } else {
        setDiscountError(data.message || "Failed to apply discount code");
      }
    } catch {
      setDiscountError("Failed to apply discount code. Please try again.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    sessionStorage.removeItem("activeDiscount");
    setDiscountSuccess(null);
    setDiscountError(null);
  };

  const handleProceedToCheckout = () => {
    if (appliedDiscount) {
      sessionStorage.setItem("activeDiscount", JSON.stringify(appliedDiscount));
      router.push(`/checkout?discount=${encodeURIComponent(appliedDiscount.code)}`);
    } else {
      router.push("/checkout");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-100 mb-6 text-neutral-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-3">
          Your cart is empty
        </h1>
        <p className="text-neutral-500 max-w-md mx-auto mb-8 text-base">
          Looks like you haven&apos;t added any items to your shopping cart yet. Explore our
          catalog and find something you love!
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Shopping Cart
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 divide-y divide-neutral-200 border-t border-b border-neutral-200">
          {items.map((item) => {
            const imageUrl = getProductImage(item.product.images);
            const isOutOfStock = item.product.stock <= 0;
            const isLowStock = item.product.stock > 0 && item.product.stock < item.quantity;

            return (
              <div
                key={item.id}
                className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug || item.product.id}`}
                      className="text-base font-semibold text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-sm text-neutral-500">
                        {formatPrice(item.product.price)} each
                      </p>
                      {item.color && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          Color: {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          Size: {item.size}
                        </span>
                      )}
                    </div>
                    {isOutOfStock ? (
                      <p className="text-xs text-red-600 font-medium mt-1">Out of stock</p>
                    ) : isLowStock ? (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        Only {item.product.stock} available
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-neutral-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={item.quantity >= item.product.stock}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal for item */}
                  <div className="text-right min-w-[5rem]">
                    <span className="text-base font-semibold text-neutral-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Order Summary</h2>

            {/* Free Shipping Shortfall & Progress Banner */}
            <div
              className={`mb-5 p-3.5 rounded-xl border transition-all ${
                isFreeShipping
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-white border-neutral-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-1.5 font-medium">
                  <Truck
                    className={`w-4 h-4 shrink-0 ${
                      isFreeShipping ? "text-emerald-600" : "text-neutral-700"
                    }`}
                  />
                  {isFreeShipping ? (
                    <span className="font-bold text-emerald-800">
                      🎉 You unlocked FREE Pan-India Delivery!
                    </span>
                  ) : (
                    <span>
                      Add <strong className="text-neutral-900 font-bold">{formatPrice(shortfall)}</strong> more for{" "}
                      <strong className="text-emerald-700 font-bold">FREE Shipping</strong>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-neutral-500">
                  {progressPercent}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-neutral-200/70 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFreeShipping ? "bg-emerald-600" : "bg-neutral-900"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-neutral-500 mt-2">
                {isFreeShipping
                  ? "Orders ₹1,499 & above enjoy Pan-India Free Delivery."
                  : `Free Pan-India shipping threshold: ₹${FREE_SHIPPING_THRESHOLD}. Current subtotal: ${formatPrice(subtotal)}.`}
              </p>
            </div>

            {/* Available Customer Coupons Section */}
            {availableCoupons.length > 0 && (
              <div className="mb-5 pt-3 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Available Offers For You ({availableCoupons.length})
                  </span>
                  {fetchingCoupons && (
                    <span className="text-[10px] text-neutral-400">updating...</span>
                  )}
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                  {availableCoupons.map((coupon) => {
                    const isCurrentlyApplied = appliedDiscount?.code === coupon.code;

                    return (
                      <div
                        key={coupon.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          isCurrentlyApplied
                            ? "bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300"
                            : coupon.isFirstOrderCoupon
                            ? "bg-amber-50/60 border-amber-200 hover:border-amber-300"
                            : coupon.isEligible
                            ? "bg-white border-neutral-200 hover:border-neutral-300 shadow-xs"
                            : "bg-neutral-100/60 border-neutral-200/60 opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold tracking-wider px-2 py-0.5 bg-neutral-900 text-white rounded text-[11px]">
                              {coupon.code}
                            </span>
                            <span className="font-semibold text-neutral-800 text-[11px]">
                              {coupon.badge}
                            </span>
                          </div>

                          {isCurrentlyApplied ? (
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Applied
                            </span>
                          ) : coupon.isEligible ? (
                            <button
                              type="button"
                              onClick={() => handleApplySpecificCoupon(coupon.code)}
                              disabled={discountLoading}
                              className="px-2.5 py-1 bg-neutral-900 text-white font-medium text-[11px] rounded-lg hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Apply
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-medium">
                              Min {formatPrice(coupon.minOrder)}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-600 mt-1.5 leading-snug">
                          {coupon.description}
                        </p>

                        {coupon.salesPrompt && !coupon.isEligible && (
                          <p className="text-[10px] font-medium text-amber-700 mt-1 flex items-center gap-1">
                            <span>💡</span>
                            <span>{coupon.salesPrompt}</span>
                          </p>
                        )}

                        {coupon.daysLeft !== null && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            ⏳ Expires in {coupon.daysLeft} {coupon.daysLeft === 1 ? "day" : "days"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discount Code Input */}
            <div className="mb-5 pt-3 border-t border-neutral-200">
              <form onSubmit={handleApplyDiscount} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent uppercase placeholder:normal-case"
                  />
                </div>
                <button
                  type="submit"
                  disabled={discountLoading || !discountCodeInput.trim()}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {discountLoading ? "..." : "Apply"}
                </button>
              </form>

              {/* Feedback messages */}
              {discountError && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{discountError}</span>
                </div>
              )}

              {discountSuccess && !appliedDiscount && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{discountSuccess}</span>
                </div>
              )}

              {appliedDiscount && (
                <div className="mt-3 flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold">{appliedDiscount.code}</span>
                      <span className="ml-1 text-emerald-700">
                        ({appliedDiscount.type === "PERCENTAGE"
                          ? `${appliedDiscount.value}% off${appliedDiscount.maxDiscount ? ` up to ${formatPrice(appliedDiscount.maxDiscount)}` : ""}`
                          : `${formatPrice(appliedDiscount.value)} off`})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDiscount}
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors cursor-pointer"
                    aria-label="Remove discount"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-sm text-neutral-600 border-t border-neutral-200 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
              </div>

              {appliedDiscount && currentDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Discount ({appliedDiscount.code})
                  </span>
                  <span>-{formatPrice(currentDiscountAmount)}</span>
                </div>
              )}

              {/* Shipping overview */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Shipping</span>
                </div>
                <span className="font-medium text-neutral-900">
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-semibold">Free</span>
                  ) : (
                    <span className="text-xs text-neutral-600 font-normal">Calculated at checkout</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Tax (5%)</span>
                <span className="font-medium text-neutral-900">{formatPrice(estimatedTax)}</span>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex justify-between items-baseline">
                <span className="text-base font-bold text-neutral-900">Total</span>
                <span className="text-xl font-bold text-neutral-900">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                or continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
