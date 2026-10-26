"use client";

import Link from "next/link";
import { useState } from "react";
import { Product } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

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
  // Maximum 8 products (4 cards per Face)
  const displayProducts = (products || []).slice(0, 8);
  const totalItems = displayProducts.length;

  // Exactly 2 Faces (Face 0: items 0-3, Face 1: items 4-7)
  const [activeFace, setActiveFace] = useState<0 | 1>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const hasTwoFaces = totalItems > 4;

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

  if (totalItems === 0) return null;

  return (
    <section className="py-6 sm:py-8 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
            <Link
              href={targetLink}
              className="text-xs sm:text-sm font-semibold text-[#162082] hover:underline"
            >
              View All →
            </Link>
          </div>

          {/* Carousel Controls */}
          {hasTwoFaces && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={`Previous ${title} items`}
                title="Previous products"
                className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label={`Next ${title} items`}
                title="Next products"
                className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid for Active Face */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative"
        >
          <div
            key={activeFace}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn"
          >
            {currentFaceProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
