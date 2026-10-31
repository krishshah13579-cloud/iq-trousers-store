"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  const { data: session, status: authStatus } = useSession();
  const isLoggedIn = authStatus === "authenticated" && Boolean(session?.user);

  // Automatically determines active month (0-11)
  const currentMonthIndex = new Date().getMonth();

  // Active coupon tied exclusively to logged-in user's account (based on purchases & usage)
  const [accountCoupon, setAccountCoupon] = useState<StoreCoupon | null>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch account-bound discount based on purchases & usage when user is logged in
  useEffect(() => {
    let isMounted = true;

    if (authStatus === "loading") {
      return;
    }

    if (!isLoggedIn) {
      setAccountCoupon(null);
      return;
    }

    async function fetchUserAccountDiscount() {
      try {
        const res = await fetch("/api/discounts/available?cartTotal=2000");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data) {
          if (data.userDiscount) {
            setAccountCoupon({
              id: data.userDiscount.id,
              code: data.userDiscount.code,
              type: data.userDiscount.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
              value: Number(data.userDiscount.value),
              minOrder: Number(data.userDiscount.minOrder || 0),
              description: data.userDiscount.description || "",
            });
          } else if (Array.isArray(data.coupons)) {
            const personal = data.coupons.find((c: any) => c.isPersonal);
            if (personal) {
              setAccountCoupon({
                id: personal.id,
                code: personal.code,
                type: personal.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
                value: Number(personal.value),
                minOrder: Number(personal.minOrder || 0),
                description: personal.description || "",
              });
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    fetchUserAccountDiscount();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, authStatus]);

  // Compute monthly posters with account-bound coupon code
  const allMonthlySlides: CampaignPoster[] = getMonthlyPosters(
    currentMonthIndex,
    accountCoupon?.code || ""
  );

  // CRITICAL REQUIREMENT:
  // "DISCOUNT COUPON POSTER SHOWED TO USER MUST BE LOGGED IN AND THE DISCOUNT SHOULD BE AVAILABLE TO THAT ACCOUNT."
  // If user is not logged in or account has no available discount, do NOT show the discount poster!
  const slides: CampaignPoster[] = allMonthlySlides.filter((slide) => {
    if (slide.type === "discount") {
      return isLoggedIn && accountCoupon !== null;
    }
    return true;
  });

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

      {/* Responsive Luxury Hero Banner Container */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[3.2/1] min-h-[400px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[460px] xl:min-h-[480px] max-h-[520px] overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === (current % Math.max(slides.length, 1));
          const couponForSlide = accountCoupon || {
            id: "default",
            code: "VIP",
            type: "PERCENTAGE" as const,
            value: 25,
            minOrder: 1999,
            description: "Exclusive Account Discount",
          };

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Responsive Background Poster Image */}
              <div className="absolute inset-0">
                <picture>
                  {slide.mobileBgImage && (
                    <source
                      media="(max-width: 639px)"
                      srcSet={slide.mobileBgImage}
                    />
                  )}
                  <img
                    src={slide.bgImage}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center scale-100 transform transition-transform duration-1000 ease-out"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </picture>

                {/* Mobile portrait vignette: dark bottom gradient ensuring model is clear at top & text is 100% legible */}
                <div className="sm:hidden absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

                {/* Desktop widescreen vignette: subtle on the left so model on right is 100% visible */}
                <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/35 to-transparent sm:w-2/3 md:w-3/5" />
                <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
              </div>

              {/* Poster Foreground Content - Minimal Luxury Branded Aesthetic */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-12 lg:px-16 flex items-end sm:items-center pb-7 sm:pb-0">
                <div className="max-w-md sm:max-w-lg lg:max-w-xl py-3 sm:py-8 space-y-2 sm:space-y-4">
                  {/* Subtle Brand Pill */}
                  <div>
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[11px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase bg-white/10 backdrop-blur-md text-white/90 border border-white/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      <span className="truncate max-w-[220px] xs:max-w-[280px] sm:max-w-none">
                        IQ TROUSERS • {slide.type === "festival" ? "SIGNATURE BESPOKE" : slide.type === "discount" ? "EXCLUSIVE PRIVILEGE" : "ORIGINAL FIT"}
                      </span>
                    </span>
                  </div>

                  {/* Clean, High-Fashion Headline */}
                  <div>
                    {slide.type === "festival" && (
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold tracking-tight text-white uppercase leading-[1.1] sm:leading-[1.05] drop-shadow-md">
                        Master-Crafted Formals. <br />
                        <span className="text-neutral-300 font-light">Cut to Command.</span>
                      </h2>
                    )}

                    {slide.type === "discount" && (
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold tracking-tight text-white uppercase leading-[1.1] sm:leading-[1.05] drop-shadow-md">
                        Luxury Design. <br />
                        <span className="text-rose-400 font-light">Honest Pricing.</span>
                      </h2>
                    )}

                    {slide.type === "new-arrival" && (
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold tracking-tight text-white uppercase leading-[1.1] sm:leading-[1.05] drop-shadow-md">
                        We Don&apos;t Make Everything. <br />
                        <span className="text-sky-300 font-light">We Perfect Trousers.</span>
                      </h2>
                    )}
                  </div>

                  {/* Minimal Subtitle */}
                  <p className="text-[11px] sm:text-sm text-neutral-300/90 font-normal tracking-normal max-w-md line-clamp-2 sm:line-clamp-1">
                    {slide.type === "festival" && "Tailored precision for elevated everyday and formal elegance."}
                    {slide.type === "discount" && (couponForSlide.description || `${couponForSlide.type === "PERCENTAGE" ? `${couponForSlide.value}% off` : `₹${couponForSlide.value} off`} orders over ₹${couponForSlide.minOrder.toLocaleString("en-IN")}`)}
                    {slide.type === "new-arrival" && "360° adaptive flex mobility with permanent razor-creased drape."}
                  </p>

                  {/* Clean CTA Button */}
                  <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-4">
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-2 sm:py-3 rounded-full bg-white text-neutral-950 font-bold text-[11px] sm:text-xs uppercase tracking-wider hover:bg-neutral-100 active:scale-95 transition-all shadow-lg cursor-pointer"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>

                    {slide.type === "discount" && couponForSlide.code && (
                      <button
                        type="button"
                        onClick={() => handleCopyCoupon(couponForSlide.code)}
                        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-mono text-amber-300 hover:bg-black/60 transition-all cursor-pointer"
                        title="Copy coupon code"
                      >
                        <span>{couponForSlide.code}</span>
                        {copiedCouponCode === couponForSlide.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>
                    )}
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
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-70 hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          aria-label="Next Carousel Slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center opacity-70 hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Minimal Slide Indicators */}
        <div className="absolute bottom-2.5 sm:bottom-4 inset-x-0 z-20 flex items-center justify-center gap-1.5 sm:gap-2 px-4 pointer-events-auto">
          {slides.map((_, index) => {
            const isActive = index === current;
            return (
              <button
                type="button"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                aria-label={`Slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-8 bg-white shadow-md shadow-white/30"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
