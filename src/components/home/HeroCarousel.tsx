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
  CheckCircle2,
} from "lucide-react";
import {
  getMonthlyPosters,
  MONTHLY_CAMPAIGNS,
  CampaignPoster,
} from "@/lib/monthlyCampaigns";

interface StoreCoupon {
  id: string;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minOrder: number;
  description: string;
}

export default function HeroCarousel() {
  // Automatically determines active month (0-11)
  const currentMonthIndex = new Date().getMonth();

  // Active public coupon (defaults to FLAT100, synced with DB if available)
  const [activeCoupon, setActiveCoupon] = useState<StoreCoupon>({
    id: "coupon-flat100",
    code: "FLAT100",
    type: "FIXED",
    value: 100,
    minOrder: 1999,
    description: "Flat ₹100 Off on orders above ₹1,999",
  });

  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
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
          const publicCoupons = data.coupons.filter(
            (c: { isPersonal?: boolean; code?: string }) => !c.isPersonal && c.code
          );
          if (isMounted && publicCoupons.length > 0) {
            const best = publicCoupons[0];
            setActiveCoupon({
              id: best.id,
              code: best.code,
              type: best.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
              value: Number(best.value),
              minOrder: Number(best.minOrder || 0),
              description: best.description || `Flat ₹${best.value} Off on orders above ₹${best.minOrder}`,
            });
          }
        }
      } catch {
        // Fallback to default
      }
    }
    fetchPublicCoupon();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active slides for current month
  const slides: CampaignPoster[] = getMonthlyPosters(currentMonthIndex, activeCoupon.code);

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
      setCopiedCouponCode(code);
      try {
        localStorage.setItem("iq_saved_coupon", code);
      } catch {}
      setTimeout(() => setCopiedCouponCode(null), 2500);
    } catch {
      // ignore clipboard error
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
      {/* Iconic Style Red Brand Tab in Top Corner */}
      <div className="absolute top-0 left-6 sm:left-12 z-20 pointer-events-none">
        <div className="bg-[#b91c1c] text-white px-2.5 pt-2 pb-3.5 shadow-2xl rounded-b-md flex flex-col items-center border-x border-b border-red-800">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-200">
            IQ
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 animate-pulse" />
        </div>
      </div>

      {/* Compact Widescreen Hero Banner Container matching Louis Philippe compact layout */}
      <div className="relative w-full aspect-[3.2/1] min-h-[380px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[460px] xl:min-h-[480px] max-h-[500px] overflow-hidden">
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
              {/* Background Poster Image (1920x600 3.2:1 ratio) */}
              <div className="absolute inset-0">
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center scale-100 transform transition-transform duration-1000 ease-out"
                  loading={index === 0 ? "eager" : "lazy"}
                />

                {/* Subtle vignette on the left so model on right is 100% visible and unsmudged */}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/35 to-transparent sm:w-2/3 md:w-3/5" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
              </div>

              {/* Poster Foreground Content */}
              <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex items-center">
                <div className="max-w-xl lg:max-w-2xl py-6 sm:py-8 space-y-2.5 sm:space-y-3">
                  {/* 1. Official Company Branding Lockup (Trouser & Formal Pant Manufacturer) */}
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#b91c1c] text-white font-black text-xs px-2.5 py-1 tracking-widest uppercase rounded-xs shadow-md font-sans">
                      IQ
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase font-sans">
                          IQ TROUSERS
                        </span>
                        <span className="px-1.5 py-0.5 rounded-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black tracking-wider uppercase">
                          MANUFACTURER DIRECT
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] tracking-widest text-neutral-400 uppercase font-medium">
                        AHMEDABAD TEXTILE MILLS • TROUSERS &amp; FORMAL PANTS
                      </span>
                    </div>
                  </div>

                  {/* 2. Distinctive Poster Badge */}
                  <div>
                    {slide.type === "festival" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>IN-HOUSE TROUSER MILL • BESPOKE FORMAL PANTS</span>
                      </span>
                    )}

                    {slide.type === "discount" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs">
                        <Tag className="w-3.5 h-3.5 text-rose-400" />
                        <span>FACTORY-DIRECT PRIVILEGE • 25% OFF HONEST MAKER PRICING</span>
                      </span>
                    )}

                    {slide.type === "new-arrival" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>100% DEDICATED TROUSER &amp; PANT SPECIALISTS</span>
                      </span>
                    )}
                  </div>

                  {/* 3. Bold, Punchy Billboard Headline */}
                  <div>
                    {slide.type === "festival" && (
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tighter text-white uppercase leading-[0.95] font-sans drop-shadow-2xl">
                        MASTER-CRAFTED FORMAL PANTS. <br />
                        <span className="text-amber-400">DIRECT FROM OUR MILL.</span>
                      </h2>
                    )}

                    {slide.type === "discount" && (
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] font-black tracking-tighter text-white uppercase leading-[0.96] font-sans drop-shadow-2xl">
                        PREMIUM DESIGN SHOULDN&apos;T REQUIRE <br />
                        <span className="text-[#ef4444]">A PREMIUM MARKUP.</span>
                      </h2>
                    )}

                    {slide.type === "new-arrival" && (
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tighter text-white uppercase leading-[0.95] font-sans drop-shadow-2xl">
                        WE DON&apos;T MAKE EVERYTHING. <br />
                        <span className="text-sky-400">WE PERFECT TROUSERS.</span>
                      </h2>
                    )}
                  </div>

                  {/* 4. Subtitle */}
                  <p className="text-xs sm:text-[13px] md:text-sm font-bold text-amber-100/90 tracking-tight leading-snug drop-shadow-sm max-w-md sm:max-w-lg line-clamp-2">
                    {slide.type === "festival" && (
                      <>Every pair of formal pants is precision-patterned, mill-woven, and hand-creased in our Ahmedabad workshop. True maker craftsmanship—no retail markup.</>
                    )}
                    {slide.type === "discount" && (
                      <>By manufacturing in-house, we eliminate showroom commissions. Get ₹3,500+ luxury-grade formal pants direct from the workshop with 25% off + ₹{activeCoupon.value} voucher.</>
                    )}
                    {slide.type === "new-arrival" && (
                      <>We manufacture only trousers and formal pants. Decades of dedicated pattern engineering deliver an immaculate silhouette and all-day 360° adaptive flex.</>
                    )}
                  </p>

                  {/* 5. Festival Poster: Formal Spec Badges */}
                  {slide.type === "festival" && (
                    <div className="pt-0.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide">
                        ✦ In-House Worsted Weave
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide">
                        ★ Ahmedabad Master Tailoring
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide">
                        ⚡ Permanent Razor-Creased Drape
                      </span>
                    </div>
                  )}

                  {/* 5b. Discount Poster: Perforated Luxury Voucher Ticket */}
                  {slide.type === "discount" && (
                    <div className="pt-0.5 space-y-1.5">
                      <div className="inline-flex flex-wrap items-center gap-2.5 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-dashed border-rose-500/80 shadow-md">
                        <div className="flex flex-col text-left pr-2 border-r border-white/15">
                          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                            DIRECT MAKER VOUCHER
                          </span>
                          <span className="text-sm sm:text-base font-black tracking-widest text-amber-300 font-mono">
                            {activeCoupon.code}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(activeCoupon.code)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                            copiedCouponCode === activeCoupon.code
                              ? "bg-emerald-500 text-white font-black"
                              : "bg-white text-neutral-950 hover:bg-neutral-200"
                          }`}
                        >
                          {copiedCouponCode === activeCoupon.code ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>COPIED!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>TAP TO COPY</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-neutral-300 font-medium">
                        ⚡ Direct manufacturer discount applied at checkout on orders over ₹{activeCoupon.minOrder.toLocaleString("en-IN")}.
                      </p>
                    </div>
                  )}

                  {/* 6. New Arrival Poster: Technical Feature Pills */}
                  {slide.type === "new-arrival" && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide shadow-xs">
                        ✦ Specialized Trouser Mills
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide shadow-xs">
                        ★ High-Density Safety Seams
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide shadow-xs">
                        ⚡ 360° Adaptive Formal Stretch
                      </span>
                    </div>
                  )}

                  {/* 7. CTA Action Button */}
                  <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-white text-neutral-950 font-black text-xs uppercase tracking-widest hover:bg-neutral-200 active:scale-95 transition-all shadow-xl cursor-pointer"
                    >
                      <span>
                        {slide.type === "festival" && "EXPLORE FORMAL PANTS"}
                        {slide.type === "discount" && "CLAIM FACTORY PRICING"}
                        {slide.type === "new-arrival" && "SHOP OUR TROUSERS"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase hidden sm:inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Direct From Mill • Pan-India DTDC Express</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          aria-label="Previous Carousel Slide"
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          aria-label="Next Carousel Slide"
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Interactive Lookbook Tabs (01 Festive • 02 Sale • 03 New In) */}
        <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2 sm:gap-2.5 px-4">
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
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? "bg-white text-neutral-950 scale-105 border border-white shadow-amber-400/20"
                    : "bg-black/60 text-neutral-300 hover:text-white hover:bg-black/80 border border-white/15 hover:border-white/30"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive ? "bg-amber-500 animate-pulse" : "bg-neutral-400"
                  }`}
                />
                <span className="tracking-widest uppercase text-[10px] sm:text-[11px]">
                  0{index + 1} • {s.tabTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
