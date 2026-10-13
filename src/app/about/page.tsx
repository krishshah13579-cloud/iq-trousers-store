import Link from "next/link";
import { ArrowRight, Sparkles, Feather, Scissors, Truck } from "lucide-react";

export const metadata = {
  title: "About Us | IQ Trousers",
  description:
    "Tailored for Life. Engineered for Comfort. Learn about Our Story, Our Mission, and the IQ Standards behind IQ Trousers.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="bg-neutral-950 text-white py-20 sm:py-25 px-4 sm:px-6 lg:px-8 border-b border-neutral-900">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
            About Us
          </h1>
        </div>
      </section>

      {/* Main Narrative: Our Story & Our Mission */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Story & Mission text */}
          <div className="lg:col-span-7 space-y-10">
            {/* Our Story */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                The Origin
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
                Our Story
              </h2>
              <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                At IQ Trousers, we believe that you shouldn&apos;t have to choose between looking sharp and feeling comfortable. For too long, menswear has been divided into two frustrating categories: stiff formal wear that you can&apos;t wait to take off, and casual wear that lacks structure and refinement.
              </p>
            </div>

            {/* Our Mission */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                The Purpose
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
                Our Mission
              </h2>
              <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                We created IQ Trousers to bridge this gap.
              </p>
              <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                To craft the perfect everyday trousers for the modern man. Whether you are stepping into a boardroom, working from a cafe, or enjoying a weekend off, our collections are designed to move seamlessly through your day.
              </p>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-100 shadow-xl border border-neutral-200 group">
              <img
                src="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1000"
                alt="IQ Trousers - Precision & Comfort"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                <div className="text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
                    Krish Clothing Co.
                  </p>
                  <p className="text-lg font-serif font-bold mt-1">
                    Everyday Casuals & Formal Wear
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The IQ Standards (3 Core Pillars) */}
        <div className="mt-24 pt-20 border-t border-neutral-200">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Our Core Pillars
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-neutral-900 tracking-tight mt-2">
              IQ Standards
            </h2>
            <p className="text-neutral-600 text-base mt-3 leading-relaxed">
              We obsess over the details so you don&apos;t have to. Every pair of IQ Trousers is built on three core pillars:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-neutral-50 hover:bg-neutral-100/70 transition-colors p-8 sm:p-10 rounded-3xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 mb-6 shadow-xs">
                  <Feather className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-neutral-900 mb-3">
                  Premium Fabrics
                </h3>
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                  We source ultra-soft, breathable materials that offer an incredible &ldquo;comfort feel&rdquo; without losing their shape.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-neutral-50 hover:bg-neutral-100/70 transition-colors p-8 sm:p-10 rounded-3xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 mb-6 shadow-xs">
                  <Scissors className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-neutral-900 mb-3">
                  Precision Stitching
                </h3>
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                  Our high-density, premium stitching ensures a tailored fit and long-lasting durability.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-neutral-50 hover:bg-neutral-100/70 transition-colors p-8 sm:p-10 rounded-3xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 mb-6 shadow-xs">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-neutral-900 mb-3">
                  Uncompromised Convenience
                </h3>
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                  We offer Free Delivery on all orders, ensuring a premium experience from our checkout to your wardrobe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 p-10 sm:p-14 bg-neutral-950 text-white rounded-3xl text-center flex flex-col items-center">
          <h3 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
            Ready to Experience the Difference?
          </h3>
          <p className="text-sm sm:text-base text-neutral-300 max-w-md mt-3 mb-8 leading-relaxed">
            Discover our Everyday Casuals and Formal Wear collections engineered for precision and comfort.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <span>Shop Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
