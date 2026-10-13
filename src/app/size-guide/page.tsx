import Link from "next/link";
import { Ruler, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Size Guide | IQ Trousers",
  description:
    "Official measurement guide and sizing tables for IQ Trousers and Formals by Krish Clothing Co.",
};

const TROUSER_SIZING = [
  { size: "28", waist: '29.5" - 30"', hip: '11"', length: '41"' },
  { size: "30", waist: '31.5" - 32"', hip: '11.5"', length: '41"' },
  { size: "32", waist: '33.5" - 34"', hip: '12"', length: '41"' },
  { size: "34", waist: '35.5" - 36"', hip: '12.5"', length: '41"' },
  { size: "36", waist: '37.5" - 38"', hip: '13"', length: '41"' },
  { size: "38", waist: '39.5" - 40"', hip: '13.5"', length: '41"' },
  { size: "40", waist: '41.5" - 42"', hip: '14"', length: '41"' },
  { size: "42", waist: '43.5" - 44"', hip: '14.5"', length: '41"' },
  { size: "44", waist: '45.5" - 46"', hip: '15"', length: '41"' },
];

const FORMAL_SIZING = [
  { size: "30", waist: '28"', hip: '11"', length: '41"' },
  { size: "32", waist: '30"', hip: '11.5"', length: '41"' },
  { size: "34", waist: '32"', hip: '12"', length: '41"' },
  { size: "36", waist: '34"', hip: '12.5"', length: '41"' },
  { size: "38", waist: '36"', hip: '13"', length: '41"' },
  { size: "40", waist: '38"', hip: '13.5"', length: '41"' },
  { size: "42", waist: '40"', hip: '14"', length: '41"' },
  { size: "44", waist: '42"', hip: '14.5"', length: '41"' },
];

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Ruler className="w-3.5 h-3.5" />
            <span>Fit & Measurements</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-neutral-900 tracking-tight">
            IQ Trousers Size Guide
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base mt-3 leading-relaxed">
            Every pair is engineered with precision tailoring. Use the official measurement tables below to find your ideal fit.
          </p>
        </div>

        {/* How to Measure Section */}
        <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200 mb-16">
          <h2 className="text-xl font-serif font-bold text-neutral-900 mb-6">
            How to Measure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-neutral-700">
            <div className="p-5 bg-white rounded-xl border border-neutral-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Step 1
              </span>
              <h3 className="font-bold text-neutral-900 text-base mb-1.5">Waist</h3>
              <p className="text-neutral-600 text-xs leading-relaxed">
                Measure the narrowest part of your waistline where you naturally wear your trousers.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-neutral-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Step 2
              </span>
              <h3 className="font-bold text-neutral-900 text-base mb-1.5">Hips</h3>
              <p className="text-neutral-600 text-xs leading-relaxed">
                Measure around the fullest part of your hips, keeping the tape straight and level.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-neutral-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Step 3
              </span>
              <h3 className="font-bold text-neutral-900 text-base mb-1.5">Length</h3>
              <p className="text-neutral-600 text-xs leading-relaxed">
                Measure from the top of the waistband straight down to the bottom hem (Standard 41&quot;).
              </p>
            </div>
          </div>
        </div>

        {/* Table 1: Men's Trouser */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden mb-12">
          <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Size Table Men&apos;s Trouser (Everyday Casuals)
            </h2>
            <span className="text-xs text-neutral-300 font-medium">Standard 41&quot; Length</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-800 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Size</th>
                  <th className="px-6 py-3.5">Waist (Inch)</th>
                  <th className="px-6 py-3.5">Hip (In Inch)</th>
                  <th className="px-6 py-3.5">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {TROUSER_SIZING.map((row) => (
                  <tr key={row.size} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-neutral-900 text-base">
                      {row.size}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-neutral-800">{row.waist}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{row.hip}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Men's Formal */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden mb-16">
          <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Size Table Men&apos;s Formal
            </h2>
            <span className="text-xs text-neutral-300 font-medium">Standard 41&quot; Length</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-800 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Size</th>
                  <th className="px-6 py-3.5">Waist (Inch)</th>
                  <th className="px-6 py-3.5">Hip (In Inch)</th>
                  <th className="px-6 py-3.5">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {FORMAL_SIZING.map((row) => (
                  <tr key={row.size} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-neutral-900 text-base">
                      {row.size}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-neutral-800">{row.waist}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{row.hip}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tailoring Advice / CTA */}
        <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-neutral-900 mb-1">
              Engineered for Precision Comfort
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600">
              All IQ Trousers are manufactured with proportional grading and comfort waistband engineering.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-950 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
          >
            <span>Explore All Trousers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
