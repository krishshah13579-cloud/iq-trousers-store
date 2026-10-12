import Link from "next/link";
import { Ruler, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Size Guide | IQ Trousers",
  description:
    "Comprehensive size chart and measurement instructions for IQ Trousers across sizes 28 to 44.",
};

const SIZE_CHART = [
  { size: "28", waistIn: "28 - 29", waistCm: "71 - 74", hipIn: "35 - 36", inseamIn: "32", thighIn: "21.5", legOpeningIn: "13.5" },
  { size: "30", waistIn: "30 - 31", waistCm: "76 - 79", hipIn: "37 - 38", inseamIn: "32", thighIn: "22.5", legOpeningIn: "14.0" },
  { size: "32", waistIn: "32 - 33", waistCm: "81 - 84", hipIn: "39 - 40", inseamIn: "32", thighIn: "23.5", legOpeningIn: "14.5" },
  { size: "34", waistIn: "34 - 35", waistCm: "86 - 89", hipIn: "41 - 42", inseamIn: "32", thighIn: "24.5", legOpeningIn: "15.0" },
  { size: "36", waistIn: "36 - 37", waistCm: "91 - 94", hipIn: "43 - 44", inseamIn: "32", thighIn: "25.5", legOpeningIn: "15.5" },
  { size: "38", waistIn: "38 - 39", waistCm: "96 - 99", hipIn: "45 - 46", inseamIn: "32", thighIn: "26.5", legOpeningIn: "16.0" },
  { size: "40", waistIn: "40 - 41", waistCm: "101 - 104", hipIn: "47 - 48", inseamIn: "32", thighIn: "27.5", legOpeningIn: "16.5" },
  { size: "42", waistIn: "42 - 43", waistCm: "106 - 109", hipIn: "49 - 50", inseamIn: "32", thighIn: "28.5", legOpeningIn: "17.0" },
  { size: "44", waistIn: "44 - 45", waistCm: "111 - 114", hipIn: "51 - 52", inseamIn: "32", thighIn: "29.5", legOpeningIn: "17.5" },
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
            Our trousers are engineered with precision tailoring. Use the conversion table below to find your ideal fit from size 28 to 44.
          </p>
        </div>

        {/* Size Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden mb-16">
          <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Standard Trouser Sizing (Inches)
            </h2>
            <span className="text-xs text-neutral-500 font-medium">All garments standard 32&quot; inseam</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="bg-neutral-100/70 text-xs uppercase font-semibold text-neutral-800 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Size</th>
                  <th className="px-6 py-3.5">Waist (Inches)</th>
                  <th className="px-6 py-3.5">Waist (CM)</th>
                  <th className="px-6 py-3.5">Hip (Inches)</th>
                  <th className="px-6 py-3.5">Inseam</th>
                  <th className="px-6 py-3.5">Thigh</th>
                  <th className="px-6 py-3.5">Leg Opening</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {SIZE_CHART.map((row) => (
                  <tr key={row.size} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900 text-base">
                      {row.size}
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-800">{row.waistIn}&quot;</td>
                    <td className="px-6 py-4 text-neutral-600">{row.waistCm} cm</td>
                    <td className="px-6 py-4 text-neutral-600">{row.hipIn}&quot;</td>
                    <td className="px-6 py-4 text-neutral-600">{row.inseamIn}&quot;</td>
                    <td className="px-6 py-4 text-neutral-600">{row.thighIn}&quot;</td>
                    <td className="px-6 py-4 text-neutral-600">{row.legOpeningIn}&quot;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to Measure Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
            <h3 className="text-lg font-serif font-bold text-neutral-900 mb-4">
              How to Measure Your Trousers
            </h3>
            <ul className="space-y-4 text-sm text-neutral-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900">1. Natural Waist:</strong> Measure around your natural waistline, where you normally wear your trousers. Keep one finger between the tape and your body for ease.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900">2. Hip Circumference:</strong> Measure around the fullest point of your hips and buttocks, keeping the tape level around your body.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900">3. Inseam Length:</strong> Measure from the crotch point down the inside leg to the bottom hem where you want your trouser cuff to sit.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900">4. Thigh:</strong> Measure horizontally around the fullest part of the thigh, approximately 1 inch below the crotch seam.
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-neutral-900 text-white rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
                Tailoring Advice
              </span>
              <h3 className="text-xl font-serif font-bold mt-2 mb-3">
                Need Help Finding Your Size?
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                If you are between sizes, we recommend ordering one size up for a relaxed fit or your exact measurement for a crisp tailored silhouette. All IQ Trousers feature internal waistband flexibility for maximum daily comfort.
              </p>
            </div>
            <div className="pt-8">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <span>Browse All Trousers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
