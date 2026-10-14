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
  ShieldCheck,
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
  isFirstOrderCoupon?: boolean;
}

export default function HeroCarousel() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(() => {
    return new Date().getMonth();
  });

  // Coupons available for users (fetched live from DB)
  const [availableCoupons, setAvailableCoupons] = useState<StoreCoupon[]>([
    {
      id: "coupon-flat100",
      code: "FLAT100",
      type: "FIXED",
      value: 100,
      minOrder: 1999,
      description: "Flat ₹100 Off on orders above ₹1,999",
      isFirstOrderCoupon: false,
    },
    {
      id: "coupon-welcome10",
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrder: 0,
      description: "10% First Order Welcome Discount",
      isFirstOrderCoupon: true,
    },
  ]);

  const [selectedCouponCode, setSelectedCouponCode] = useState<string>("FLAT100");
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch live active discounts from DB
  useEffect(() => {
    let isMounted = true;
    async function fetchPublicCoupons() {
      try {
        const res = await fetch("/api/discounts/available?cartTotal=2000");
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.coupons) && data.coupons.length > 0) {
          const list: StoreCoupon[] = data.coupons.map((c: any) => ({
            id: c.id,
            code: c.code,
            type: c.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
            value: Number(c.value),
            minOrder: Number(c.minOrder || 0),
            description:
              c.description ||
              (c.type === "PERCENTAGE"
                ? `${c.value}% OFF on your cart`
                : `Flat ₹${c.value} OFF on orders above ₹${c.minOrder}`),
            isFirstOrderCoupon: Boolean(c.isFirstOrderCoupon),
          }));

          if (isMounted && list.length > 0) {
            setAvailableCoupons(list);
            setSelectedCouponCode(list[0].code);
          }
        }
      } catch {
        // Fallback to default coupons
      }
    }
    fetchPublicCoupons();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active slides for selected month
  const slides: CampaignPoster[] = getMonthlyPosters(currentMonthIndex, selectedCouponCode);
  const activeMonthConfig = MONTHLY_CAMPAIGNS[currentMonthIndex] || MONTHLY_CAMPAIGNS[9];

  // Active coupon currently selected for the discount poster
  const activeCoupon =
    availableCoupons.find((c) => c.code === selectedCouponCode) || availableCoupons[0];

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
      setSelectedCouponCode(code);
      try {
        localStorage.setItem("iq_saved_coupon", code);
      } catch {}
      setTimeout(() => setCopiedCouponCode(null), 2500);
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
      {/* Levi's Style Iconic Red Brand Tab in Top Corner */}
      <div className="absolute top-0 left-6 sm:left-10 z-30 pointer-events-none">
        <div className="bg-[#b91c1c] text-white px-2.5 pt-2 pb-3.5 shadow-2xl rounded-b-md flex flex-col items-center border-x border-b border-red-800">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-200">
            IQ
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 animate-pulse" />
        </div>
      </div>

      {/* Top Floating Campaign Selector */}
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
      <div className="relative w-full min-h-[560px] sm:min-h-[600px] md:min-h-[640px] lg:min-h-[680px] xl:min-h-[720px]">
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
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent sm:w-3/4 md:w-2/3" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-transparent to-neutral-950/40" />

                {/* Subtle Festival Golden Ambient Glow on Festival Slide */}
                {slide.type === "festival" && (
                  <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                )}
                {/* Subtle Red/Rose Glow on Discount Slide */}
                {slide.type === "discount" && (
                  <div className="absolute inset-0 bg-radial from-rose-500/15 via-transparent to-transparent pointer-events-none" />
                )}
              </div>

              {/* Slide Content Box */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-2xl py-12 sm:py-16 lg:py-20 space-y-4 sm:space-y-4.5">
                  {/* 1. OFFICIAL COMPANY BRANDING LOCKUP */}
                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shadow-sm inline-flex">
                    <img
                      src="/iq-trousers-logo-dark-mode.png"
                      alt="IQ Trousers Logo"
                      className="h-8 sm:h-9 w-auto object-contain shrink-0"
                    />
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase font-sans">
                          IQ TROUSERS
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black tracking-widest uppercase bg-amber-400 text-neutral-950">
                          ORIGINAL FIT
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] tracking-wider text-neutral-300 uppercase font-medium">
                        Precision Tailored Menswear • Ahmedabad
                      </span>
                    </div>
                  </div>

                  {/* 2. Category Pill / Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider text-amber-300 uppercase shadow-xs">
                      {renderPosterIcon(slide.type)}
                      <span>{slide.badge}</span>
                    </div>

                    {slide.tagline && (
                      <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold tracking-widest uppercase border border-amber-400/30">
                        {slide.tagline}
                      </span>
                    )}
                  </div>

                  {/* 3. High-Impact Levi's Billboard Headline (Dynamically tailored on discount poster) */}
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-white leading-none drop-shadow-lg uppercase">
                    {slide.type === "discount" ? (
                      activeCoupon.type === "FIXED" ? (
                        <>FLAT ₹{activeCoupon.value} OFF</>
                      ) : (
                        <>FLAT {activeCoupon.value}% OFF</>
                      )
                    ) : (
                      slide.title
                    )}
                  </h2>

                  {/* 4. Subtitle */}
                  <p className="text-sm sm:text-lg font-semibold text-amber-100/95 drop-shadow-xs leading-snug">
                    {slide.type === "discount" ? (
                      activeCoupon.minOrder > 0 ? (
                        <>Valid on orders above ₹{activeCoupon.minOrder.toLocaleString("en-IN")} • Code: <span className="text-amber-400 font-mono underline">{activeCoupon.code}</span></>
                      ) : (
                        <>Storewide instant discount on all trouser fits • Code: <span className="text-amber-400 font-mono underline">{activeCoupon.code}</span></>
                      )
                    ) : (
                      slide.subtitle
                    )}
                  </p>

                  {/* 5. Description */}
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl font-normal drop-shadow-xs">
                    {slide.type === "discount"
                      ? "Handcrafted luxury trousers dispatched directly from our Ahmedabad workshop. Choose from our active discount vouchers below—tap any coupon to copy & activate your instant discount at checkout."
                      : slide.description}
                  </p>

                  {/* 6. DISCOUNT POSTER: INTERACTIVE AVAILABLE COUPONS VOUCHER DECK */}
                  {slide.type === "discount" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        <span>Available Coupons for Users (Tap to Copy & Apply):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl">
                        {availableCoupons.map((c) => {
                          const isSelected = c.code === selectedCouponCode;
                          const isCopied = copiedCouponCode === c.code;

                          return (
                            <div
                              key={c.code}
                              onClick={() => handleCopyCoupon(c.code)}
                              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden backdrop-blur-md select-none active:scale-[0.98] ${
                                isSelected
                                  ? "bg-amber-400/20 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50"
                                  : "bg-black/55 border-white/15 text-neutral-200 hover:border-white/35 hover:bg-black/75"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-black text-sm tracking-widest text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-400/30">
                                  {c.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCoupon(c.code);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                                    isCopied
                                      ? "bg-emerald-500 text-white font-extrabold"
                                      : isSelected
                                      ? "bg-amber-400 text-neutral-950 hover:bg-amber-300"
                                      : "bg-white/10 text-neutral-200 hover:bg-white/20"
                                  }`}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <p className="text-xs font-bold text-white mt-2 line-clamp-1">
                                {c.type === "FIXED" ? `Flat ₹${c.value} Off` : `${c.value}% Off`}
                                {c.minOrder > 0
                                  ? ` on orders over ₹${c.minOrder.toLocaleString("en-IN")}`
                                  : " on all orders"}
                              </p>

                              <p className="text-[10px] text-neutral-300 mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{c.description}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {copiedCouponCode && (
                        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Coupon <strong>{copiedCouponCode}</strong> copied to clipboard! It will auto-apply to your order at checkout.
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* 7. NEW ARRIVAL POSTER SPECIAL: TECHNICAL FEATURE CHIPS */}
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

                  {/* 8. CTA Buttons */}
                  <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3.5">
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all shadow-xl cursor-pointer"
                    >
                      <span>
                        {slide.type === "discount"
                          ? `Shop with Code ${selectedCouponCode}`
                          : slide.ctaText}
                      </span>
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

      {/* Bottom Interactive Carousel Tabs */}
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
