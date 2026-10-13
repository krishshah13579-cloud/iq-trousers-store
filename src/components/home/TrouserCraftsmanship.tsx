"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Feather,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    id: "waistband",
    number: "01",
    title: "Concealed 2-Inch Adaptive Flex Waistband",
    tagline: "Dynamic expansion when sitting or dining",
    description:
      "Engineered with hidden internal elastane tension bands that expand up to 2 inches when you sit or travel, then effortlessly retract without bunching. Your shirt stays neatly tucked all day.",
    icon: Sparkles,
    highlight: "Zero waist pinch points",
  },
  {
    id: "fabric",
    number: "02",
    title: "High-Twist Anti-Wrinkle Fabric Memory",
    tagline: "Sharp permanent press from 9 AM to late flights",
    description:
      "Crafted from high-twist combed cottons and fine worsted wool-feel blends. The nano-structured weave sheds travel wrinkles naturally and locks in a razor-sharp center crease through every wash.",
    icon: Feather,
    highlight: "Wrinkle-recovery weave",
  },
  {
    id: "pockets",
    number: "03",
    title: "Ergonomic 45° Anti-Drop Pockets",
    tagline: "Deep reinforced bags that never sag or spill",
    description:
      "Cut at a precise 45-degree angle with heavy-duty pocket bags. Your phone, wallet, and keys sit flush along your outer thigh, preventing unsightly bulging and accidental drops in low car seats.",
    icon: Layers,
    highlight: "Flush smartphone silhouette",
  },
  {
    id: "hardware",
    number: "04",
    title: "Reinforced Lockstitch & YKK Hardware",
    tagline: "Built for years of high-frequency wear",
    description:
      "Every high-stress zone—from the saddle gusset to pocket corners—is reinforced with military-grade double-needle lockstitching and genuine Japanese YKK brass hardware to eliminate blowouts.",
    icon: ShieldCheck,
    highlight: "Stress-tested durability",
  },
];

export default function TrouserCraftsmanship() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-neutral-100 text-[#162082] border border-neutral-200/80 mb-3">
            KRISH CLOTHING CO. • PRECISION ENGINEERING
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-normal text-[#162082] tracking-tight">
            The Anatomy of Perfect Trousers
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed font-light">
            We spent years refining the trouser silhouette so you never have to choose
            between boardroom elegance and sweatpants-level comfort.
          </p>
        </div>

        {/* 2-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Interactive Feature Cards */}
          <div className="lg:col-span-7 space-y-3.5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = activeFeature === idx;
              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveFeature(idx)}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left select-none ${
                    isActive
                      ? "bg-neutral-50/90 border-[#162082]/30 shadow-md ring-1 ring-[#162082]/10"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-neutral-50/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-1 rounded-lg shrink-0 ${
                        isActive
                          ? "bg-[#162082] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {feat.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {feat.title}
                        </h3>
                        <span
                          className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {feat.highlight}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {feat.tagline}
                      </p>
                      {isActive && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-2.5 leading-relaxed animate-fadeIn">
                          {feat.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Garment Visual & Floating Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-xl group">
              <img
                src="/hero-trouser-banner.jpg"
                alt="IQ Trousers Tailoring Craftsmanship"
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
              />

              {/* Ambient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top Floating Badge */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-gray-900 text-xs font-semibold backdrop-blur-md shadow-md border border-white/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tailored by Krish Clothing Co.</span>
              </div>

              {/* Bottom Card Spotlight */}
              <div className="absolute bottom-5 inset-x-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-lg text-left">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                  Featured Innovation
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {features[activeFeature].title}
                </p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {features[activeFeature].description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#162082] hover:bg-[#101760] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-98"
          >
            <span>Explore All Tailored Trousers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
