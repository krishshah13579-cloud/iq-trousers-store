"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, ShoppingCart, Check } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // Parse product images
  let imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600";
  try {
    const parsed = JSON.parse(product.images);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
      imageUrl = parsed[0];
    } else if (typeof parsed === "string" && parsed) {
      imageUrl = parsed;
    }
  } catch {
    if (product.images && product.images.startsWith("http")) {
      imageUrl = product.images;
    }
  }

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
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-200">
      {/* Product Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square w-full overflow-hidden bg-gray-50"
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

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            aria-label="Add to cart"
            className={`flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 ${
              product.stock <= 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : added
                ? "bg-emerald-600 text-white"
                : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95 shadow-sm"
            }`}
          >
            {added ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
