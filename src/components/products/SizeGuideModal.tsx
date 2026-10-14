"use client";

import { useState } from "react";
import { Ruler, X, Check, ArrowRight } from "lucide-react";
import { SizeGuideRow } from "@/types";

export const DEFAULT_TROUSER_SIZE_GUIDE: SizeGuideRow[] = [
  { brandSize: "28", waist: "28", length: "41" },
  { brandSize: "30", waist: "30", length: "41" },
  { brandSize: "32", waist: "32", length: "41" },
  { brandSize: "34", waist: "34", length: "41" },
  { brandSize: "36", waist: "36", length: "41" },
  { brandSize: "38", waist: "38", length: "41" },
  { brandSize: "40", waist: "40", length: "41" },
  { brandSize: "42", waist: "42", length: "41" },
  { brandSize: "44", waist: "44", length: "41" },
];

/**
 * Converts a measurement string between Inches and Centimeters.
 * Handles single numbers ("32") and ranges ("31.5 - 32" or "31.5-32").
 */
export function formatMeasurement(rawVal: string, unit: "IN" | "CM"): string {
  if (!rawVal) return "-";
  const clean = rawVal.replace(/[^\d.-]/g, " ").trim();
  const numbers = clean.match(/(\d+(\.\d+)?)/g);

  if (!numbers || numbers.length === 0) {
    return rawVal;
  }

  if (unit === "IN") {
    // If original was already roughly inches, format cleanly
    if (numbers.length === 1) {
      return `${numbers[0]}"`;
    } else if (numbers.length === 2) {
      return `${numbers[0]}" – ${numbers[1]}"`;
    }
    return `${clean}"`;
  }

  // Convert to CM: 1 in = 2.54 cm
  if (numbers.length === 1) {
    const cm = (parseFloat(numbers[0]) * 2.54).toFixed(1);
    return `${cm.endsWith(".0") ? cm.slice(0, -2) : cm} cm`;
  } else if (numbers.length === 2) {
    const cm1 = (parseFloat(numbers[0]) * 2.54).toFixed(1);
    const cm2 = (parseFloat(numbers[1]) * 2.54).toFixed(1);
    const clean1 = cm1.endsWith(".0") ? cm1.slice(0, -2) : cm1;
    const clean2 = cm2.endsWith(".0") ? cm2.slice(0, -2) : cm2;
    return `${clean1} – ${clean2} cm`;
  }

  return rawVal;
}

interface SizeGuideContentProps {
  rows?: SizeGuideRow[] | null;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  availableSizes?: string[];
}

export function SizeGuideTable({
  rows,
  selectedSize,
  onSelectSize,
  availableSizes,
}: SizeGuideContentProps) {
  const [unit, setUnit] = useState<"IN" | "CM">("IN");
  
  // Only display size guide rows for the available sizes selected for this product
  const dataRows = (() => {
    const base = rows && rows.length > 0 ? rows : DEFAULT_TROUSER_SIZE_GUIDE;
    if (availableSizes && availableSizes.length > 0) {
      const filtered = base.filter((r) => availableSizes.includes(r.brandSize));
      if (filtered.length > 0) return filtered;
    }
    return base;
  })();

  return (
    <div className="space-y-4">
      {/* Unit Switcher */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Ruler className="w-3.5 h-3.5 text-gray-700" />
          <span className="font-medium text-gray-700">Measurement Unit:</span>
        </div>

        <div className="inline-flex rounded-lg bg-gray-100 p-0.5 border border-gray-200">
          <button
            type="button"
            onClick={() => setUnit("IN")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              unit === "IN"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            IN (Inches)
          </button>
          <button
            type="button"
            onClick={() => setUnit("CM")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              unit === "CM"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            CM (Centimeters)
          </button>
        </div>
      </div>

      {/* Sizing Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-4 py-3">
                Brand Size
              </th>
              <th scope="col" className="px-4 py-3">
                Waist ({unit})
              </th>
              <th scope="col" className="px-4 py-3">
                Length ({unit})
              </th>
              {onSelectSize && (
                <th scope="col" className="px-3 py-3 text-right">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dataRows.map((row, idx) => {
              const isCurrent = selectedSize && selectedSize === row.brandSize;
              return (
                <tr
                  key={`${row.brandSize}-${idx}`}
                  onClick={() => onSelectSize && onSelectSize(row.brandSize)}
                  className={`transition-colors ${
                    isCurrent
                      ? "bg-blue-50/70 font-semibold text-[#162082]"
                      : "hover:bg-gray-50 text-gray-800"
                  } ${onSelectSize ? "cursor-pointer" : ""}`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap font-bold text-gray-900">
                    <span className="inline-flex items-center gap-1.5">
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#162082]" />}
                      Size {row.brandSize}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">
                    {formatMeasurement(row.waist, unit)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">
                    {formatMeasurement(row.length, unit)}
                  </td>
                  {onSelectSize && (
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? "bg-[#162082] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {isCurrent ? "Selected" : "Select"}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Measurement Advice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
        <div>
          <span className="font-bold text-gray-900 block mb-0.5">
            1. Waist Measurement
          </span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Wrap tape around your natural waistline where your trousers normally rest. Keep one finger between tape and body.
          </p>
        </div>
        <div>
          <span className="font-bold text-gray-900 block mb-0.5">
            2. Trouser Length
          </span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Standard length measures 41&quot; (104 cm) from waistband down to bottom cuff, engineered for clean break over dress shoes.
          </p>
        </div>
      </div>
    </div>
  );
}

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows?: SizeGuideRow[] | null;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  availableSizes?: string[];
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  rows,
  selectedSize,
  onSelectSize,
  availableSizes,
}: SizeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#162082] flex items-center justify-center border border-blue-200 shrink-0">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Size &amp; Measurement Guide
              </h3>
              <p className="text-[11px] text-gray-500">
                Official sizing standards by Krish Clothing Co.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <SizeGuideTable
            rows={rows}
            selectedSize={selectedSize}
            availableSizes={availableSizes}
            onSelectSize={(s) => {
              if (onSelectSize) onSelectSize(s);
              onClose();
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Need custom fit advice? Free doorstep size exchange.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
