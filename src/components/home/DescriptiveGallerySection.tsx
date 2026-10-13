"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

interface CategoryShowcaseProps {
  title: string;
  slug: string;
  products: Product[];
}

export default function DescriptiveGallerySection({
  title,
  slug,
  products,
}: CategoryShowcaseProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Maximize cards displayed to 4
  const displayProducts = (products || []).slice(0, 4);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Royal Navy Title with Carousel Arrows */}
        <div className="relative flex items-center justify-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-5xl font-sans font-normal text-[#162082] tracking-tight text-center">
            {title}
          </h2>

          {/* Carousel Arrows (Visible when products exist) */}
          {displayProducts.length > 0 && (
            <div className="absolute right-0 hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label={`Previous ${title} products`}
                className="w-9 h-9 rounded-full border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-black transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label={`Next ${title} products`}
                className="w-9 h-9 rounded-full border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-black transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Carousel / Grid */}
        {displayProducts.length === 0 ? (
          <div className="py-12 px-4 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">
              New {title} arrivals coming soon. Check back shortly.
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 overflow-x-auto sm:overflow-visible scroll-smooth pb-4 sm:pb-0 scrollbar-none snap-x snap-mandatory"
          >
            {displayProducts.map((product) => {
              // Parse images
              let imageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600";
              try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                  imageUrl = String(parsed[0]).trim();
                } else if (typeof parsed === "string" && parsed.trim()) {
                  imageUrl = parsed.trim();
                }
              } catch {
                if (typeof product.images === "string" && product.images.trim()) {
                  if (product.images.startsWith("data:")) {
                    imageUrl = product.images.trim();
                  } else {
                    const split = product.images.split(",")[0]?.trim();
                    if (split) imageUrl = split;
                  }
                }
              }

              const isWish = isInWishlist(product.id);

              return (
                <div
                  key={product.id}
                  onMouseEnter={() => setHoveredCard(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative flex flex-col bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200 flex-shrink-0 sm:flex-shrink w-[260px] sm:w-auto snap-start"
                >
                  {/* 1:1 Square Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border-b border-gray-200">
                    <Link href={`/products/${product.id}`} className="block w-full h-full">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-102"
                        loading="lazy"
                      />
                    </Link>

                    {/* Wishlist Button (Top-Right) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition-all duration-200 shadow-sm cursor-pointer ${
                        isWish
                          ? "bg-white text-rose-500 opacity-100 shadow-md scale-105"
                          : "bg-white/90 text-gray-700 hover:text-rose-500 hover:bg-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105"
                      }`}
                      title={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
                      aria-label={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isWish ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Text Area Below Image */}
                  <div className="p-3.5 sm:p-4 bg-white flex flex-col justify-between flex-1">
                    <div>
                      <Link
                        href={`/products/${product.id}`}
                        className="block text-[#284898] hover:text-[#162082] text-sm font-normal tracking-wide transition-colors"
                      >
                        {product.name}
                      </Link>

                      {/* Price Line: Strikethrough compare price + sale price */}
                      <div className="mt-1 flex items-baseline gap-2 text-xs sm:text-sm">
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="line-through text-gray-400 font-light">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                        <span className="text-gray-900 font-normal">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Centered Royal Navy "Shop Now" Button */}
        <div className="mt-10 sm:mt-14 flex justify-center">
          <Link
            href={`/products?category=${slug}`}
            className="inline-flex items-center justify-center px-12 py-3 bg-[#0d1b74] hover:bg-[#081254] text-white text-xs sm:text-sm font-medium tracking-wide transition-colors shadow-xs active:scale-98 cursor-pointer"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
