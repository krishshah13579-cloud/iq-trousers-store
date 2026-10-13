"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Snowflake,
  Briefcase,
  Shirt,
} from "lucide-react";

interface CarouselSlide {
  id: string;
  tabTitle: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgImage: string;
  icon: "snowflake" | "shirt" | "briefcase";
}

const carouselSlides: CarouselSlide[] = [
  {
    id: "winter-collection",
    tabTitle: "Winter Collection",
    badge: "WINTER 2026 • NEW SEASON ARRIVAL",
    title: "Winter Collection",
    subtitle: "Heavyweight Flannels, Corduroys & Thermal Wool Blends",
    description:
      "Engineered for cold-weather refinement and comfort. Thick-gauge worsted flannels, textured cotton corduroys, and insulated stretch linings tailored with surgical precision.",
    ctaText: "Shop Winter Collection",
    ctaLink: "/products",
    bgImage: "/winter-collection-hero.jpg",
    icon: "snowflake",
  },
  {
    id: "everyday-casual",
    tabTitle: "Everyday Casual",
    badge: "COLLECTION 01 • EVERYDAY WEAR",
    title: "Everyday Casual",
    subtitle: "Engineered for 24/7 Movement, Breathability & Comfort",
    description:
      "Crafted from 4-way stretch twill, French linen, and enzyme-washed cottons with adaptive flex waistbands. Casual perfection from morning work to weekend leisure.",
    ctaText: "Shop Everyday Casual",
    ctaLink: "/products?category=everyday-casual",
    bgImage: "/everyday-casual-hero.jpg",
    icon: "shirt",
  },
  {
    id: "formal-wear",
    tabTitle: "Formal Wear",
    badge: "COLLECTION 02 • FORMAL TROUSERS",
    title: "Formal Wear",
    subtitle: "Precision-Engineered Elegance & Boardroom Authority",
    description:
      "Manufactured from high-grade wool blends with curtained waistbands, anti-slip shirt grips, and razor-sharp French creases tailored for executive presence.",
    ctaText: "Shop Formal Wear",
    ctaLink: "/products?category=formal-wear",
    bgImage: "/formal-wear-hero.jpg",
    icon: "briefcase",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % carouselSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrent(index);
    // Pause briefly so user can inspect their selected slide
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  }, []);

  // Autoplay timer (every 6 seconds unless paused)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  const renderBadgeIcon = (type: CarouselSlide["icon"]) => {
    switch (type) {
      case "snowflake":
        return <Snowflake className="w-3.5 h-3.5 text-sky-400" />;
      case "shirt":
        return <Shirt className="w-3.5 h-3.5 text-amber-400" />;
      case "briefcase":
        return <Briefcase className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-neutral-950 text-white select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="IQ Trousers Hero Carousel"
    >
      {/* Slides Container */}
      <div className="relative w-full min-h-[500px] sm:min-h-[560px] md:min-h-[600px] lg:min-h-[640px] xl:min-h-[680px]">
        {carouselSlides.map((slide, index) => {
          const isActive = index === current;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Background Image with Cinematic Dark Gradient */}
              <div className="absolute inset-0">
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {/* Gradient for optimal text legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/75 to-neutral-950/25 sm:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-neutral-950/30" />
              </div>

              {/* Slide Content Box */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-2xl py-16 sm:py-20 lg:py-28 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider text-amber-300 uppercase shadow-xs">
                    {renderBadgeIcon(slide.icon)}
                    <span>{slide.badge}</span>
                  </div>

                  <h2 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white leading-tight drop-shadow-md">
                    {slide.title}
                  </h2>

                  <p className="text-lg sm:text-xl font-medium text-amber-100/90 drop-shadow-xs">
                    {slide.subtitle}
                  </p>

                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl font-light">
                    {slide.description}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-3.5">
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all shadow-xl cursor-pointer"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous Carousel Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next Carousel Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom Interactive Carousel Tabs / Indicators */}
      <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-2 sm:gap-3 px-4">
        {carouselSlides.map((s, index) => {
          const isActive = index === current;
          return (
            <button
              type="button"
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Switch to ${s.tabTitle}`}
              className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-md cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "bg-white text-neutral-950 scale-105 border border-white shadow-amber-400/20"
                  : "bg-black/60 text-neutral-300 hover:text-white hover:bg-black/80 border border-white/15 hover:border-white/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isActive ? "bg-amber-500 animate-pulse" : "bg-neutral-400"
                }`}
              />
              <span className="tracking-wide uppercase text-[11px] sm:text-xs">
                {s.tabTitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
