"use client";

import { useState } from "react";
import {
  Menu,
  ChevronDown,
  ChevronUp,
  Shirt,
  Truck,
  RotateCcw,
  Sparkles,
  Ruler,
} from "lucide-react";
import { SizeGuideRow } from "@/types";
import { SizeGuideTable, DEFAULT_TROUSER_SIZE_GUIDE } from "./SizeGuideModal";

interface ProductDetailsAccordionsProps {
  description: string;
  careInstructions?: string | null;
  sizeGuide?: string | null;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  availableSizes?: string[];
}

export default function ProductDetailsAccordions({
  description,
  careInstructions,
  sizeGuide,
  selectedSize,
  onSelectSize,
  availableSizes,
}: ProductDetailsAccordionsProps) {
  // Size Guide is right before Description like Amazon
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);

  // Parse size guide rows
  let parsedRows: SizeGuideRow[] = DEFAULT_TROUSER_SIZE_GUIDE;
  if (sizeGuide) {
    try {
      const parsed = JSON.parse(sizeGuide);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedRows = parsed;
      }
    } catch {}
  }

  const defaultCare =
    "Machine wash cold (30°C) with like colors on a gentle cycle. Do not bleach. Line dry in shade. Warm iron inside-out. Dry clean compatible.";

  return (
    <div id="product-accordions" className="pt-4 border-t border-gray-100 space-y-3">
      {/* 1. Size Guide Accordion (OPEN BEFORE PRODUCT DESCRIPTION LIKE AMAZON) */}
      <div
        id="size-guide-accordion"
        className="rounded-2xl border border-gray-200/90 overflow-hidden bg-white shadow-2xs transition-all"
      >
        <button
          type="button"
          onClick={() => setIsSizeGuideOpen((prev) => !prev)}
          className="w-full px-4 py-3.5 bg-gray-50/60 hover:bg-gray-100/60 transition-colors flex items-center justify-between text-left select-none border-b border-gray-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-[#162082] shadow-2xs">
              <Ruler className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight block">
                Size Guide &amp; Measurements
              </span>
              <span className="text-[10px] text-gray-500">
                Brand Size, Waist &amp; Length (IN / CM)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#162082] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 hidden sm:inline">
              IN / CM Options
            </span>
            <div className="p-1 rounded-md text-gray-500">
              {isSizeGuideOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </button>

        {isSizeGuideOpen && (
          <div className="p-4 sm:p-5 text-xs sm:text-sm text-gray-600 animate-fadeIn space-y-3">
            <SizeGuideTable
              rows={parsedRows}
              selectedSize={selectedSize}
              availableSizes={availableSizes}
              onSelectSize={onSelectSize}
            />
          </div>
        )}
      </div>

      {/* 2. Product Description */}
      <div className="rounded-2xl border border-gray-200/90 overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => setIsDescOpen((prev) => !prev)}
          className="w-full px-4 py-3.5 bg-gray-50/60 hover:bg-gray-100/60 transition-colors flex items-center justify-between text-left select-none border-b border-gray-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-2xs">
              <Menu className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              Product Description
            </span>
          </div>
          <div className="p-1 rounded-md text-gray-500">
            {isDescOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isDescOpen && (
          <div className="p-4 text-xs sm:text-sm text-gray-600 leading-relaxed space-y-2 animate-fadeIn">
            <p className="whitespace-pre-line">{description}</p>
          </div>
        )}
      </div>

      {/* 3. Care Instructions (Collapsible) */}
      <div className="rounded-2xl border border-gray-200/90 overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => setIsCareOpen((prev) => !prev)}
          className="w-full px-4 py-3.5 bg-gray-50/60 hover:bg-gray-100/60 transition-colors flex items-center justify-between text-left select-none border-b border-gray-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-[#162082] shadow-2xs">
              <Shirt className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              Care Instructions &amp; Maintenance
            </span>
          </div>
          <div className="p-1 rounded-md text-gray-500">
            {isCareOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isCareOpen && (
          <div className="p-4 text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 animate-fadeIn">
            <p className="whitespace-pre-line">
              {careInstructions?.trim() || defaultCare}
            </p>
            <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                Cold Wash (30°C)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                Line Dry in Shade
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                Warm Iron
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                Do Not Bleach
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Shipping & Exchanges (Collapsible) */}
      <div className="rounded-2xl border border-gray-200/90 overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => setIsShippingOpen((prev) => !prev)}
          className="w-full px-4 py-3.5 bg-gray-50/60 hover:bg-gray-100/60 transition-colors flex items-center justify-between text-left select-none border-b border-gray-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-emerald-600 shadow-2xs">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              Delivery &amp; 7-Day Doorstep Exchanges
            </span>
          </div>
          <div className="p-1 rounded-md text-gray-500">
            {isShippingOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isShippingOpen && (
          <div className="p-4 text-xs sm:text-sm text-gray-600 leading-relaxed space-y-2 animate-fadeIn">
            <p>
              • <strong>Pan-India Express Delivery</strong>: Delivered in 3–5 business days. Free shipping on orders over ₹1,499.
            </p>
            <p>
              • <strong>Hassle-Free Exchanges</strong>: Doorstep size exchange available within 7 days of delivery.
            </p>
            <p>
              • <strong>Safe &amp; Secure Packaging</strong>: Tamper-evident dust-proof polybag for pristine fabric condition.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
