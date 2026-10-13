"use client";

import { Heart } from "lucide-react";
import { Product } from "@/types";
import { useWishlist } from "@/context/WishlistContext";

interface ProductWishlistButtonProps {
  product: Product;
  className?: string;
  showText?: boolean;
}

export default function ProductWishlistButton({
  product,
  className = "",
  showText = false,
}: ProductWishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWish = isInWishlist(product.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }}
      aria-label={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
      title={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
      className={`inline-flex items-center justify-center gap-2 p-2.5 rounded-full border transition-all duration-200 cursor-pointer ${
        isWish
          ? "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100 shadow-2xs"
          : "border-gray-200 bg-white text-gray-700 hover:text-rose-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
      } ${className}`}
    >
      <Heart
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
          isWish ? "fill-rose-500 text-rose-500" : ""
        }`}
      />
      {showText && (
        <span className="text-xs font-medium">
          {isWish ? "Wishlisted" : "Add to Wishlist"}
        </span>
      )}
    </button>
  );
}
