"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
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
} from "lucide-react";

interface AppliedDiscount {
  id: string;
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

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

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

  // Financial calculations
  const subtotal = totalPrice;
  const isFreeShipping = subtotal >= 100;
  const shipping = items.length === 0 ? 0 : isFreeShipping ? 0 : 10;
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;

  // Recalculate discount amount based on current subtotal if percentage or fixed
  let currentDiscountAmount = 0;
  if (appliedDiscount && subtotal >= appliedDiscount.minOrder) {
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
                      href={`/products/${item.product.slug}`}
                      className="text-base font-semibold text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {formatPrice(item.product.price)} each
                    </p>
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
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
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
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
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
                    onClick={() => removeItem(item.productId)}
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
            <h2 className="text-lg font-bold text-neutral-900 mb-5">Order Summary</h2>

            {/* Discount Code Input */}
            <div className="mb-6">
              <form onSubmit={handleApplyDiscount} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    placeholder="Discount code"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent uppercase placeholder:normal-case"
                  />
                </div>
                <button
                  type="submit"
                  disabled={discountLoading || !discountCodeInput.trim()}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {discountLoading ? "Applying..." : "Apply"}
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
                        ({appliedDiscount.type === "PERCENTAGE" ? `${appliedDiscount.value}% off` : `$${appliedDiscount.value} off`})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDiscount}
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
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

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span>Shipping</span>
                  {!isFreeShipping && (
                    <span className="text-[11px] text-neutral-400">
                      Add {formatPrice(100 - subtotal)} for free shipping
                    </span>
                  )}
                </div>
                <span className="font-medium text-neutral-900">
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-medium">Free</span>
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

            {/* Checkout Button */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors shadow-sm"
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
