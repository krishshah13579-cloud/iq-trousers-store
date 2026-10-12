"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { ShippingAddress } from "@/types";
import {
  CreditCard,
  MapPin,
  Truck,
  CheckCircle,
  AlertCircle,
  Tag,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface AppliedDiscount {
  id?: string;
  code: string;
  type: string;
  value: number;
  amount: number;
  minOrder: number;
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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCart();

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discount state initialized from sessionStorage
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
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  // Load discount from URL query if provided
  const queryDiscount = useMemo(() => searchParams.get("discount"), [searchParams]);

  useEffect(() => {
    if (!queryDiscount) return;

    let isMounted = true;
    fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: queryDiscount.trim().toUpperCase(), orderTotal: totalPrice }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.valid && data.discount) {
          setAppliedDiscount(data.discount);
          sessionStorage.setItem("activeDiscount", JSON.stringify(data.discount));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [queryDiscount, totalPrice]);

  const handleApplyDiscount = async () => {
    const cleanCode = discountCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    setDiscountLoading(true);
    setDiscountError(null);

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, orderTotal: totalPrice }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedDiscount(data.discount);
        sessionStorage.setItem("activeDiscount", JSON.stringify(data.discount));
        setDiscountCodeInput("");
      } else {
        setDiscountError(data.message || "Invalid discount code");
      }
    } catch {
      setDiscountError("Failed to apply discount code");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    sessionStorage.removeItem("activeDiscount");
    setDiscountError(null);
  };

  // Financial calculations
  const subtotal = totalPrice;
  const isFreeShipping = subtotal >= 100;
  const shipping = items.length === 0 ? 0 : isFreeShipping ? 0 : 10;
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;

  let currentDiscountAmount = 0;
  if (appliedDiscount && subtotal >= (appliedDiscount.minOrder || 0)) {
    if (appliedDiscount.type === "PERCENTAGE") {
      currentDiscountAmount = Math.round(((subtotal * appliedDiscount.value) / 100) * 100) / 100;
    } else {
      currentDiscountAmount = Math.min(appliedDiscount.value, subtotal);
    }
  }

  const finalTotal = Math.max(
    0,
    Math.round((subtotal - currentDiscountAmount + shipping + estimatedTax) * 100) / 100
  );

  const effectiveFullName = formData.fullName || session?.user?.name || "";

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!effectiveFullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Street address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State or Province is required";
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP / Postal code is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.trim().length < 7) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const submissionAddress: ShippingAddress = {
      ...formData,
      fullName: effectiveFullName,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
          })),
          shippingAddress: submissionAddress,
          discountCode: appliedDiscount?.code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success: clear cart and discount cache
      clearCart();
      sessionStorage.removeItem("activeDiscount");

      // Redirect to the newly created order's details page
      router.push(`/orders/${data.id}`);
    } catch (err) {
      console.error("Order submission error:", err);
      setSubmitError("An unexpected error occurred while placing your order.");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Checking your account...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">No items to checkout</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Your shopping cart is empty. Add products to proceed with checkout.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Store</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Checkout
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Complete your order by providing shipping and delivery information
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-medium">Could not place your order</p>
            <p className="text-xs text-red-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Shipping Details Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
                <MapPin className="w-5 h-5 text-neutral-700" />
                <h2 className="text-lg font-semibold text-neutral-900">Shipping Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={effectiveFullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                      errors.fullName ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                    } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Market Street, Apt 4B"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                      errors.address ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                    } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-semibold text-neutral-700 mb-1">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="San Francisco"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                        errors.city ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-xs font-semibold text-neutral-700 mb-1">
                      State / Province *
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="CA"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                        errors.state ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                    />
                    {errors.state && (
                      <p className="text-xs text-red-600 mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-xs font-semibold text-neutral-700 mb-1">
                      ZIP / Postal Code *
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="94105"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                        errors.zipCode ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                    />
                    {errors.zipCode && (
                      <p className="text-xs text-red-600 mt-1">{errors.zipCode}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-xs font-semibold text-neutral-700 mb-1">
                      Country *
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                        errors.country ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                    />
                    {errors.country && (
                      <p className="text-xs text-red-600 mt-1">{errors.country}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                      errors.phone ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                    } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-neutral-700" />
                <h2 className="text-lg font-semibold text-neutral-900">Payment Information</h2>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900">Standard Test / Cash on Delivery</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    No payment details required at this step. Your order will be confirmed and processed immediately upon placement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 sticky top-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Order Summary</h2>

              {/* Items List */}
              <div className="divide-y divide-neutral-200 max-h-64 overflow-y-auto mb-6 pr-1">
                {items.map((item) => {
                  const imageUrl = getProductImage(item.product.images);
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                          <Image
                            src={imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {item.product.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>Qty: {item.quantity} × {formatPrice(item.product.price)}</span>
                            {item.size && (
                              <span className="font-semibold text-neutral-700 bg-neutral-200/80 px-1.5 py-0.2 rounded text-[11px]">
                                Size {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 shrink-0">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Discount Code Input */}
              <div className="mb-5 pt-3 border-t border-neutral-200">
                {!appliedDiscount ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCodeInput}
                        onChange={(e) => setDiscountCodeInput(e.target.value)}
                        placeholder="Discount code"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={discountLoading || !discountCodeInput.trim()}
                        className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {discountLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-[11px] text-red-600 mt-1">{discountError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <span className="font-semibold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {appliedDiscount.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-neutral-500 hover:text-neutral-800 font-medium text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 text-sm text-neutral-600 border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
                </div>

                {appliedDiscount && currentDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-{formatPrice(currentDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-neutral-400" />
                    <span>Shipping</span>
                  </div>
                  <span className="font-medium text-neutral-900">
                    {isFreeShipping ? (
                      <span className="text-emerald-700">Free</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-medium text-neutral-900">{formatPrice(estimatedTax)}</span>
                </div>

                <div className="border-t border-neutral-200 pt-4 flex justify-between items-baseline">
                  <span className="text-base font-bold text-neutral-900">Total</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Place Order ({formatPrice(finalTotal)})</span>
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] text-neutral-400">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

