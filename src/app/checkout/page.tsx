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
  calculateShippingFee,
  FREE_SHIPPING_THRESHOLD,
  INDIAN_STATES,
} from "@/lib/shipping";
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
  Check,
} from "lucide-react";

interface AppliedDiscount {
  id?: string;
  code: string;
  type: string;
  value: number;
  maxDiscount?: number | null;
  amount: number;
  minOrder?: number;
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
  const { items, totalPrice, clearCart, isLoaded } = useCart();

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user?.name || "",
      }));
    }
  }, [session]);

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

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    sessionStorage.removeItem("activeDiscount");
  };

  // Financial calculations
  const subtotal = totalPrice;

  // Automatically remove applied coupon from selection if cart value is lower than minimum order value
  useEffect(() => {
    if (!isLoaded || status === "loading") return;

    if (appliedDiscount && (appliedDiscount.minOrder || 0) > 0 && subtotal < (appliedDiscount.minOrder || 0)) {
      setAppliedDiscount(null);
      sessionStorage.removeItem("activeDiscount");
    }
  }, [subtotal, appliedDiscount, isLoaded, status]);
  const hasEnteredLocation = Boolean(formData.state.trim() || formData.zipCode.trim());
  const shippingQuote = calculateShippingFee(subtotal, formData.state, formData.zipCode);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = items.length === 0 ? 0 : isFreeShipping ? 0 : hasEnteredLocation ? shippingQuote.amount : 0;
  const shortfall = Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - subtotal) * 100) / 100);
  // Estimated tax (5%) rounded off to nearest rupee
  const estimatedTax = Math.round(subtotal * 0.05);

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
  const rawTotal = Math.max(0, subtotal - currentDiscountAmount + shipping + estimatedTax);
  const finalTotal = Math.round(rawTotal);

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
      const res = await fetch("/api/payment/payu/initiate", {
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
        setSubmitError(data.error || "Failed to initiate PayU payment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Transition directly to secure payment screen (avoids empty cart flash)
      setIsRedirecting(true);
      clearCart();
      sessionStorage.removeItem("activeDiscount");

      if (data.isConfigured) {
        // Real/Sandbox PayU hosted checkout: Auto-submit form
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.action;

        Object.entries(data.params || {}).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(v);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        // Route to our PayU Sandbox test page
        const search = new URLSearchParams();
        Object.entries(data.params || {}).forEach(([k, v]) => {
          search.set(k, String(v));
        });
        router.push(`/payu-sandbox?${search.toString()}`);
      }
    } catch (err) {
      console.error("PayU checkout initiation error:", err);
      setSubmitError("Failed to connect to PayU payment gateway. Please try again.");
      setIsSubmitting(false);
      setIsRedirecting(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in duration-300">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm animate-pulse">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">
          Connecting to PayU Secure Payment...
        </h2>
        <p className="text-neutral-500 text-sm max-w-md mb-6 leading-relaxed">
          Please wait a moment while we securely transfer you to complete your order payment. Do not refresh or close this window.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-xs text-neutral-600 font-medium border border-neutral-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>256-Bit SSL Encrypted Connection</span>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Checking your account...</p>
      </div>
    );
  }

  if (!isRedirecting && !isSubmitting && items.length === 0) {
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
                    placeholder="Full Name"
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
                    placeholder="Address"
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
                      placeholder="AHMEDABAD"
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
                      list="indian-states-list"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Gujarat"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                        errors.state ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      } focus:outline-none focus:ring-2 focus:ring-neutral-900`}
                    />
                    <datalist id="indian-states-list">
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st} />
                      ))}
                    </datalist>
                    {errors.state && (
                      <p className="text-xs text-red-600 mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-xs font-semibold text-neutral-700 mb-1">
                      PIN / Postal Code *
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="380001"
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
                      placeholder="INDIA"
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
                    placeholder="98765 43210"
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

            {/* Payment Method */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-neutral-700" />
                  <h2 className="text-lg font-semibold text-neutral-900">Payment Method</h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% Secure
                </span>
              </div>

              {/* PayU Exclusive Card */}
              <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-4 h-4 rounded-full border-4 border-emerald-600 bg-white mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900">
                          PayU Payment Gateway
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#183b56] text-white">
                          Pay<span className="text-[#00a852]">U</span> India
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700">Online Payment</span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                      Pay securely using <strong>UPI</strong> (Google Pay, PhonePe, Paytm, BHIM), <strong>Credit / Debit Cards</strong> (Visa, Mastercard, RuPay), <strong>Net Banking</strong>, or <strong>Wallets</strong>.
                    </p>
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                        ⚡ Instant Confirmation
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                        🔒 256-Bit SSL Encrypted
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                        🛡️ Buyer Protection
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="text-neutral-400">ℹ️</span>
                <span>Cash on Delivery (COD) is disabled. All orders require secure online payment.</span>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 sticky top-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Order Summary</h2>

              {/* Free Shipping Shortfall Banner */}
              <div
                className={`mb-4 p-3 rounded-xl border text-xs ${
                  isFreeShipping
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-white border-neutral-200 shadow-xs text-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Truck
                      className={`w-4 h-4 shrink-0 ${
                        isFreeShipping ? "text-emerald-600" : "text-neutral-700"
                      }`}
                    />
                    {isFreeShipping ? (
                      <span className="font-bold text-emerald-800">
                        🎉 Free Pan-India Delivery unlocked!
                      </span>
                    ) : (
                      <span>
                        Add <strong className="text-neutral-900 font-bold">{formatPrice(shortfall)}</strong> more for{" "}
                        <strong className="text-emerald-700 font-bold">FREE Delivery</strong>
                      </span>
                    )}
                  </div>
                  {!isFreeShipping && (
                    <Link
                      href="/"
                      className="text-[11px] font-semibold text-neutral-900 underline hover:text-neutral-600 shrink-0"
                    >
                      Add items
                    </Link>
                  )}
                </div>
              </div>

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

              {/* Applied Coupon & Discount Given (No coupon selection/input on checkout) */}
              {appliedDiscount && (
                <div className="mb-5 pt-3 border-t border-neutral-200">
                  <div className="flex items-center justify-between p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-950 font-mono tracking-wide">
                            {appliedDiscount.code}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-200/60 text-emerald-800 rounded text-[10px] font-semibold">
                            Applied
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          {appliedDiscount.type === "PERCENTAGE"
                            ? `${appliedDiscount.value}% off applied${appliedDiscount.maxDiscount ? ` (up to ${formatPrice(appliedDiscount.maxDiscount)})` : ""}`
                            : `${formatPrice(appliedDiscount.value)} off applied`}
                          {currentDiscountAmount > 0
                            ? ` • Saved ${formatPrice(currentDiscountAmount)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-neutral-500 hover:text-neutral-800 font-medium text-[11px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

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
                      <span className="text-emerald-700 font-semibold">Free</span>
                    ) : hasEnteredLocation ? (
                      formatPrice(shipping)
                    ) : (
                      <span className="text-xs text-neutral-500 font-normal">Calculated once address entered</span>
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to PayU...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay via PayU ({formatPrice(finalTotal)})</span>
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

