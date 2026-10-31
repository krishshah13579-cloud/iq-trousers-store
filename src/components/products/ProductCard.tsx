"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, ShoppingCart, Check, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, getProductCoverImage, GARMENT_PHOTO_FALLBACK } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const isWish = isInWishlist(product.id);

  const handleSelectProduct = () => {
    setIsOpening(true);
  };

  // Parse product images
  const imageUrl = getProductCoverImage(product.images);

  // Parse available clothing sizes
  const availableSizes: string[] = (() => {
    if (!product.sizes) return [];
    try {
      const parsed = JSON.parse(product.sizes);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
    if (typeof product.sizes === "string") {
      return product.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  })();

  // Parse available clothing colors
  const availableColors: string[] = (() => {
    if (!product.colors) return [];
    try {
      const parsed = JSON.parse(product.colors);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
    if (typeof product.colors === "string") {
      return product.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
    return [];
  })();

  // Calculate average rating
  const reviews = product.reviews || [];
  const reviewCount = product._count?.reviews ?? reviews.length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Default to first available size or undefined
    const defaultSize = availableSizes.length > 0 ? availableSizes[0] : undefined;
    const defaultColor = availableColors.length > 0 ? availableColors[0] : undefined;

    if (status === "unauthenticated" || !session) {
      if (typeof window !== "undefined") {
        try {
          const firstImage = getProductCoverImage(product.images);

          localStorage.setItem(
            "iq_pending_cart_item",
            JSON.stringify({
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                stock: product.stock,
                images: firstImage ? JSON.stringify([firstImage]) : "[]",
                categoryId: product.categoryId,
              },
              quantity: 1,
              size: defaultSize,
              color: defaultColor,
            })
          );
        } catch (err) {
          console.warn("Storage quota warning stashing pending item", err);
        }
      }
      router.push("/login?callbackUrl=/cart");
      return;
    }

    addItem(product, 1, defaultSize, defaultColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100
        )
      : null;

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
        isOpening
          ? "border-gray-900 ring-2 ring-gray-900/15 shadow-xl scale-[0.985]"
          : "border-gray-100 hover:shadow-md hover:border-gray-200"
      }`}
    >
      {/* Top indeterminate progress line when user selects product */}
      {isOpening && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-40">
          <div className="h-full bg-gray-900 animate-pulse w-full" />
        </div>
      )}

      {/* Full-card loading overlay with spinner when selected */}
      {isOpening && (
        <div className="absolute inset-0 z-30 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 transition-all duration-300">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            <div className="absolute w-2.5 h-2.5 bg-gray-900 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
            Loading Product...
          </span>
          <span className="text-[11px] text-gray-500 font-normal mt-0.5">
            Opening details & sizes
          </span>
        </div>
      )}

      {/* Product Image */}
      <Link
        href={`/products/${product.id}`}
        prefetch={true}
        onClick={handleSelectProduct}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-gray-50 cursor-pointer"
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== GARMENT_PHOTO_FALLBACK && !target.src.endsWith(GARMENT_PHOTO_FALLBACK)) {
              target.src = GARMENT_PHOTO_FALLBACK;
            }
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide shadow-xs ${
                discountPercent >= 35
                  ? "bg-rose-600 text-white ring-2 ring-rose-300"
                  : "bg-rose-500 text-white"
              }`}
            >
              {discountPercent >= 35 ? `🔥 -${discountPercent}% OFF` : `-${discountPercent}%`}
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/80 backdrop-blur-sm text-white">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button (Top-Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWish ? "Remove from wishlist" : "Add to wishlist"}
          title={isWish ? "In Wishlist" : "Add to Wishlist"}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer ${
            isWish
              ? "bg-white text-rose-500 shadow-md scale-105"
              : "bg-white/90 text-gray-600 hover:text-rose-500 hover:bg-white hover:scale-105"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWish ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-5">
        {product.category?.name && (
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
            {product.category.name}
          </p>
        )}

        <Link
          href={`/products/${product.id}`}
          prefetch={true}
          onClick={handleSelectProduct}
          className="group-hover:text-gray-600 transition-colors"
        >
          <h3 className="font-medium text-gray-900 line-clamp-1 text-sm sm:text-base">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2">
          <div className="flex items-center text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                  star <= Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200 fill-gray-100"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] sm:text-xs text-gray-500">
            {avgRating > 0 ? avgRating.toFixed(1) : "New"}
            {reviewCount > 0 && ` (${reviewCount})`}
          </span>
        </div>

        {/* Available Sizes List */}
        {availableSizes.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-[11px] sm:text-xs text-gray-500">
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Sizes:
            </span>
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium truncate">
              {availableSizes.slice(0, 3).join(", ")}
              {availableSizes.length > 3 ? ` +${availableSizes.length - 3}` : ""}
            </span>
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.id}`}
            prefetch={true}
            onClick={handleSelectProduct}
            aria-label="View product and select size"
            className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-white shadow-sm transition-all duration-200 ${
              isOpening
                ? "bg-gray-800 scale-95"
                : "bg-gray-900 hover:bg-gray-800 active:scale-95"
            }`}
          >
            {isOpening ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
