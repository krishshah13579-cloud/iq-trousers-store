"use client";

import Link from "next/link";
import { useState } from "react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Heart, ChevronLeft, ChevronRight, ArrowRight, Sparkles, Layers, Tag } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

interface CategoryShowcaseProps {
  title: string;
  slug: string;
  description?: string;
  products: Product[];
}

const CATEGORY_DEFAULTS: Record<
  string,
  { desc: string; highlights: string[]; subtitle: string }
> = {
  "formal-wear": {
    subtitle: "BOARDROOM & EXECUTIVE ATTIRE",
    desc: "Precision-tailored trousers crafted with premium poly-viscose blend, comfort flex waistband, and crease-resistant finish for sharp executive elegance.",
    highlights: ["Permanent Crease", "Flex Comfort Waist", "Wrinkle-Resistant", "Poly-Viscose Blend"],
  },
  "everyday-casual": {
    subtitle: "SMART CHINOS & DAILY COMFORT",
    desc: "Engineered 4-way stretch chinos and casual trousers designed for effortless mobility, breathable comfort, and seamless desk-to-dinner style.",
    highlights: ["4-Way Stretch", "Breathable Twill", "All-Day Comfort", "Narrow Tapered Fit"],
  },
  "winter-2026": {
    subtitle: "SEASONAL FLANNEL & CORDUROY",
    desc: "Heavyweight worsted flannels and ribbed corduroys tailored for seasonal warmth, rich drape, and timeless cold-weather sophistication.",
    highlights: ["Warm Flannel", "Heavyweight Drape", "Thermal Weave", "Rich Texture"],
  },
};

function cleanDescription(desc?: string): string {
  if (!desc) return "Premium 4-way stretch fabric with tailored silhouette and all-day comfort.";
  // Strip markdown headings and extra symbols
  const cleaned = desc
    .replace(/^#+\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (cleaned.length > 95) {
    return cleaned.substring(0, 95).trim() + "...";
  }
  return cleaned;
}

export default function DescriptiveGallerySection({
  title,
  slug,
  description,
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

  // Curated category defaults
  const defaults = CATEGORY_DEFAULTS[slug] || {
    subtitle: "FACTORY DIRECT COLLECTION",
    desc: description || "Handcrafted with factory-direct precision, premium fabrics, and tailored silhouettes for the modern wardrobe.",
    highlights: ["Tailored Silhouette", "Factory Direct Pricing", "Superior Stitching"],
  };

  const categoryDesc = description || defaults.desc;

  return (
    <section className="py-8 sm:py-12 bg-white select-none border-b border-gray-100 last:border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Descriptive Category Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/80 pb-5">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-[#162082] border border-indigo-100">
                  <Sparkles className="w-3 h-3 text-[#162082]" />
                  {defaults.subtitle}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {totalItems > 0 ? `${totalItems}+ Styles Available` : "Curated Collection"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-normal text-[#162082] tracking-tight">
                {title}
              </h2>

              <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
                {categoryDesc}
              </p>

              {/* Category Feature Highlights */}
              <div className="flex flex-wrap gap-2 pt-1">
                {defaults.highlights.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200/70"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#162082]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Loop Carousel Controls & Direct Category Link */}
            <div className="flex items-center gap-3 sm:self-center shrink-0">
              <Link
                href={`/products?category=${slug}`}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#162082] hover:text-black transition-colors"
              >
                <span>View Full Category</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {hasTwoFaces && (
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-200">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label={`Previous ${title} items`}
                    title="Previous Slide"
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-black transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-semibold text-gray-600 px-1">
                    {activeFace + 1} / 2
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label={`Next ${title} items`}
                    title="Next Slide"
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-black transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
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
                // Parse image
                let imageUrl =
                  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600";
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

                // Parse colors
                let colorCount = 0;
                try {
                  if (product.colors) {
                    const parsedColors = JSON.parse(product.colors);
                    if (Array.isArray(parsedColors)) {
                      colorCount = parsedColors.length;
                    }
                  }
                } catch {}

                const isWish = isInWishlist(product.id);
                const isCardOpening = navigatingProductId === product.id;

                // Discount calculation
                const hasDiscount =
                  product.comparePrice && product.comparePrice > product.price;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.comparePrice! - product.price) / product.comparePrice!) * 100
                    )
                  : 0;

                const productDescSnippet = cleanDescription(product.description);

                return (
                  <div
                    key={product.id}
                    onMouseEnter={() => setHoveredCard(product.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`group relative flex flex-col bg-white rounded-xl border transition-all duration-300 overflow-hidden shadow-2xs hover:shadow-md ${
                      isCardOpening
                        ? "border-gray-900 ring-2 ring-gray-900/15 shadow-md scale-[0.985]"
                        : "border-gray-200 hover:border-gray-400"
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
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border-b border-gray-100">
                      <Link
                        href={`/products/${product.id}`}
                        onClick={() => setNavigatingProductId(product.id)}
                        className="block w-full h-full cursor-pointer"
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </Link>

                      {/* Discount Badge */}
                      {hasDiscount && discountPercent > 0 && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-tight text-white shadow-xs ${
                              discountPercent >= 35 ? "bg-rose-600" : "bg-emerald-600"
                            }`}
                          >
                            {discountPercent}% OFF
                          </span>
                        </div>
                      )}

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

                    {/* Descriptive Card Details Below Image */}
                    <div className="p-3.5 sm:p-4 bg-white flex flex-col justify-between flex-1 gap-2.5">
                      <div>
                        {/* Title and Category info */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                            {title}
                          </span>
                          {colorCount > 0 && (
                            <span className="text-[10px] font-medium text-gray-500">
                              {colorCount} {colorCount === 1 ? "color" : "colors"}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.id}`}
                          onClick={() => setNavigatingProductId(product.id)}
                          className="block text-[#162082] hover:text-[#0a1250] text-sm font-semibold tracking-tight transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>

                        {/* Product Descriptive Summary */}
                        <p className="mt-1 text-xs text-gray-500 font-light leading-relaxed line-clamp-2">
                          {productDescSnippet}
                        </p>
                      </div>

                      {/* Price Line & Quick CTA */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="line-through text-xs text-gray-400 font-light">
                              {formatPrice(product.comparePrice!)}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.id}`}
                          onClick={() => setNavigatingProductId(product.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#162082] hover:underline"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Centered Royal Navy "Shop Now" Button */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <Link
            href={`/products?category=${slug}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#0d1b74] hover:bg-[#081254] text-white text-xs sm:text-sm font-medium tracking-wide rounded-md transition-colors shadow-xs active:scale-98 cursor-pointer"
          >
            <span>Explore All {title}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
