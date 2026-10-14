"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Tag,
  Flame,
  Copy,
  Check,
  Calendar,
  Gift,
  CheckCircle2,
} from "lucide-react";
import {
  getMonthlyPosters,
  MONTHLY_CAMPAIGNS,
  CampaignPoster,
} from "@/lib/monthlyCampaigns";

export default function HeroCarousel() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(() => {
    return new Date().getMonth();
  });
  const [activeCoupon, setActiveCoupon] = useState<string>("FLAT100");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch live active discounts from DB if available
  useEffect(() => {
    let isMounted = true;
    async function fetchPublicCoupon() {
      try {
        const res = await fetch("/api/discounts/available?cartTotal=2000");
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.coupons) && data.coupons.length > 0) {
          // Find first public coupon
          const publicCoupons = data.coupons.filter(
            (c: { isPersonal?: boolean; code?: string }) => !c.isPersonal && c.code
          );
          if (isMounted && publicCoupons.length > 0) {
            setActiveCoupon(publicCoupons[0].code);
          }
        }
      } catch {
        // Fallback to default monthly coupon
      }
    }
    fetchPublicCoupon();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active slides for selected month
  const slides: CampaignPoster[] = getMonthlyPosters(currentMonthIndex, activeCoupon);
  const activeMonthConfig = MONTHLY_CAMPAIGNS[currentMonthIndex] || MONTHLY_CAMPAIGNS[9];

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrent(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  }, []);

  // Autoplay timer (every 6.5s)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6500);
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

  const handleCopyCoupon = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      try {
        localStorage.setItem("iq_saved_coupon", code);
      } catch {}
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const renderPosterIcon = (type: CampaignPoster["type"]) => {
    switch (type) {
      case "festival":
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case "discount":
        return <Tag className="w-3.5 h-3.5 text-rose-400" />;
      case "new-arrival":
        return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-neutral-950 text-white select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="IQ Trousers Hero Poster Carousel"
    >
      {/* Top Floating Month / Campaign Indicator (Interactive month switcher) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMonthPicker((prev) => !prev)}
            title="Preview different monthly festival & discount campaigns"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-neutral-200 hover:text-white transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Campaign:</span>
            <span className="font-bold text-white uppercase tracking-wider">
              {activeMonthConfig.monthName} ({activeMonthConfig.season})
            </span>
            <span className="text-gray-400 text-[10px]">▾</span>
          </button>

          {/* Month Dropdown Menu */}
          {showMonthPicker && (
            <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/15 p-2 shadow-2xl z-40 text-left divide-y divide-neutral-800">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Preview Monthly Campaigns
              </div>
              <div className="py-1">
                {MONTHLY_CAMPAIGNS.map((m) => {
                  const isCur = m.monthIndex === currentMonthIndex;
                  return (
                    <button
                      type="button"
                      key={m.monthIndex}
                      onClick={() => {
                        setCurrentMonthIndex(m.monthIndex);
                        setCurrent(0);
                        setShowMonthPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isCur
                          ? "bg-amber-400 text-neutral-950 font-bold"
                          : "text-neutral-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{m.monthName}</span>
                        <span className="text-[10px] opacity-75 font-normal truncate max-w-[160px]">
                          {m.festival.tagline}
                        </span>
                      </div>
                      {isCur && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slides Container */}
      <div className="relative w-full min-h-[540px] sm:min-h-[580px] md:min-h-[620px] lg:min-h-[660px] xl:min-h-[700px]">
        {slides.map((slide, index) => {
          const isActive = index === current;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Background Poster Image with Cinematic Contrast Gradients */}
              <div className="absolute inset-0">
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center scale-100 transform transition-transform duration-1000 ease-out"
                  loading={index === 0 ? "eager" : "lazy"}
                />

                {/* Levi's Style Moody Dark Gradient Overlay for Maximum Typographic Punch */}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent sm:w-3/4 md:w-2/3" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-transparent to-neutral-950/40" />

                {/* Subtle Festival Golden Ambient Glow on Festival Slide */}
                {slide.type === "festival" && (
                  <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                )}
                {/* Subtle Red/Rose Glow on Discount Slide */}
                {slide.type === "discount" && (
                  <div className="absolute inset-0 bg-radial from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                )}
              </div>

              {/* Slide Content Box */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-2xl py-14 sm:py-20 lg:py-24 space-y-4 sm:space-y-5">
                  {/* Category Pill / Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider text-amber-300 uppercase shadow-xs">
                      {renderPosterIcon(slide.type)}
                      <span>{slide.badge}</span>
                    </div>

                    {slide.tagline && (
                      <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold tracking-widest uppercase border border-amber-400/30">
                        {slide.tagline}
                      </span>
                    )}
                  </div>

                  {/* High-Impact Levi's Billboard Headline */}
                  <h2 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-extrabold tracking-tight text-white leading-none drop-shadow-lg uppercase">
                    {slide.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-base sm:text-xl font-semibold text-amber-100/95 drop-shadow-xs leading-snug">
                    {slide.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed max-w-xl font-normal drop-shadow-xs">
                    {slide.description}
                  </p>

                  {/* Discount Poster Special Feature: Interactive Coupon Ticket */}
                  {slide.type === "discount" && slide.couponCode && (
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 border border-amber-400/40 shadow-lg">
                        <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                            PROMO CODE
                          </span>
                          <span className="text-sm font-extrabold tracking-wider text-white font-mono">
                            {slide.couponCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(slide.couponCode!)}
                          className="ml-2 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Copy promo code"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-950" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {slide.couponOffer && (
                        <span className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{slide.couponOffer}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* New Arrival Poster Special Feature: Technical Trouser Feature Chips */}
                  {slide.type === "new-arrival" && slide.features && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {slide.features.map((feat) => (
                        <span
                          key={feat}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white tracking-wide shadow-xs"
                        >
                          <Check className="w-3 h-3 text-sky-400" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="pt-3 sm:pt-4 flex flex-wrap items-center gap-4">
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all shadow-xl cursor-pointer"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/products"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs uppercase tracking-wider border border-white/20 transition-all cursor-pointer"
                    >
                      <span>Browse All Fits</span>
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
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next Carousel Slide"
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Bottom Interactive Carousel Tabs (Festival Poster, Discount Poster, New Arrival) */}
      <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-2 sm:gap-3 px-4">
        {slides.map((s, index) => {
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
