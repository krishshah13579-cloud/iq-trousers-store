"use client";

import Link from "next/link";
import { useState } from "react";
import { Product } from "@/types";
import { formatPrice, getProductCoverImage } from "@/lib/utils";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

interface CategoryShowcaseProps {
  title: string;
  slug: string;
  customHref?: string;
  products: Product[];
}

export default function DescriptiveGallerySection({
  title,
  slug,
  customHref,
  products,
}: CategoryShowcaseProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [navigatingProductId, setNavigatingProductId] = useState<string | null>(null);

  // Maximum 8 products (4 cards per Face)
  const displayProducts = (products || []).slice(0, 8);
  const totalItems = displayProducts.length;

  // Exactly 2 Faces (Face 0: items 0-3, Face 1: items 4-7)
  const [activeFace, setActiveFace] = useState<0 | 1>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const hasTwoFaces = totalItems > 4;

  // Infinite loop navigation between the 2 Faces
  const handleToggleFace = () => {
    if (!hasTwoFaces) return;
    setActiveFace((prev) => (prev === 0 ? 1 : 0));
  };

  const handlePrev = () => handleToggleFace();
  const handleNext = () => handleToggleFace();

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || !hasTwoFaces) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 40) {
      handleToggleFace();
    }
    setTouchStart(null);
  };

  // Face 1: first 4 products; Face 2: next 4 products
  const face1 = displayProducts.slice(0, 4);
  const face2 = displayProducts.slice(4, 8);
  const currentFaceProducts = activeFace === 0 ? face1 : face2.length > 0 ? face2 : face1;

  const targetLink = customHref || `/products?category=${slug}`;

  return (
    <section className="py-2.5 sm:py-4 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Royal Navy Title with Carousel Controls */}
        <div className="relative flex items-center justify-between sm:justify-center mb-3 sm:mb-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-normal text-[#162082] tracking-tight text-left sm:text-center">
            {title}
          </h2>

          {/* Loop Carousel Controls - 2 Faces only */}
          {hasTwoFaces && (
            <div className="sm:absolute sm:right-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={`Previous ${title} items`}
                title="Previous Face (Loops)"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-black transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label={`Next ${title} items`}
                title="Next Face (Loops)"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-black transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid for Active Face */}
        {totalItems === 0 ? (
          <div className="py-12 px-4 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">
              New {title} arrivals coming soon. Check back shortly.
            </p>
          </div>
        ) : (
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative"
          >
            {/* Exactly 1 Face visible (4 items across on desktop) */}
            <div
              key={activeFace}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 animate-fadeIn"
            >
              {currentFaceProducts.map((product) => {
                // Parse image using getProductCoverImage
                const imageUrl = getProductCoverImage(product.images);

                const isWish = isInWishlist(product.id);
                const isCardOpening = navigatingProductId === product.id;

                return (
                  <div
                    key={product.id}
                    onMouseEnter={() => setHoveredCard(product.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`group relative flex flex-col bg-white border transition-all duration-300 overflow-hidden ${
                      isCardOpening
                        ? "border-gray-900 ring-2 ring-gray-900/15 shadow-md scale-[0.985]"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {/* Top progress line when selected */}
                    {isCardOpening && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-30">
                        <div className="h-full bg-gray-900 animate-pulse w-full" />
                      </div>
                    )}

                    {/* Loading overlay when selected */}
                    {isCardOpening && (
                      <div className="absolute inset-0 z-20 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 transition-all duration-300">
                        <div className="relative mb-2 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                          <div className="absolute w-2 h-2 bg-gray-900 rounded-full animate-ping" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-900">
                          Loading...
                        </span>
                      </div>
                    )}

                    {/* 1:1 Square Image Container */}
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border-b border-gray-200">
                      <Link
                        href={`/products/${product.id}`}
                        onClick={() => setNavigatingProductId(product.id)}
                        className="block w-full h-full cursor-pointer"
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-102"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.src.includes("/products/imp-001.jpg")) {
                              target.src = "/products/imp-001.jpg";
                            }
                          }}
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
                          onClick={() => setNavigatingProductId(product.id)}
                          className="block text-[#284898] hover:text-[#162082] text-sm font-normal tracking-wide transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>

                        {/* Price Line: Strikethrough compare price + sale price */}
                        <div className="mt-1 flex items-baseline gap-2 text-xs sm:text-sm">
                          {product.comparePrice &&
                            product.comparePrice > product.price && (
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
          </div>
        )}

        {/* Centered Royal Navy "Shop Now" Button */}
        <div className="mt-3.5 sm:mt-4 flex justify-center">
          <Link
            href={targetLink}
            className="inline-flex items-center justify-center px-10 py-2 sm:py-2.5 bg-[#0d1b74] hover:bg-[#081254] text-white text-xs sm:text-sm font-medium tracking-wide transition-colors shadow-xs active:scale-98 cursor-pointer"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
