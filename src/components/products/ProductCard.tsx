"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, ShoppingCart, Check, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const isWish = isInWishlist(product.id);

  // Parse product images
  let imageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600";
  try {
    const parsed = JSON.parse(product.images);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
      imageUrl = parsed[0];
    } else if (typeof parsed === "string" && parsed) {
      imageUrl = parsed;
    }
  } catch {
    if (product.images) {
      if (product.images.startsWith("data:")) {
        imageUrl = product.images;
      } else {
        const split = product.images.split(",")[0]?.trim();
        if (split) imageUrl = split;
      }
    }
  }

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
    addItem(product, 1, defaultSize);
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
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-200">
      {/* Product Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-gray-50"
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white tracking-wide">
              -{discountPercent}%
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
      <div className="flex flex-col flex-1 p-5">
        {product.category?.name && (
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
            {product.category.name}
          </p>
        )}

        <Link
          href={`/products/${product.id}`}
          className="group-hover:text-gray-600 transition-colors"
        >
          <h3 className="font-medium text-gray-900 line-clamp-1 text-base">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200 fill-gray-100"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {avgRating > 0 ? avgRating.toFixed(1) : "No reviews"}
            {reviewCount > 0 && ` (${reviewCount})`}
          </span>
        </div>

        {/* Available Sizes List */}
        {availableSizes.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-500">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Sizes:
            </span>
            <span className="text-xs text-gray-700 font-medium">
              {availableSizes.slice(0, 4).join(", ")}
              {availableSizes.length > 4 ? ` +${availableSizes.length - 4}` : ""}
            </span>
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.id}`}
            aria-label="View product and select size"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-900 text-white hover:bg-gray-800 active:scale-95 shadow-sm transition-all duration-200"
          >
            <ShoppingCart className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
