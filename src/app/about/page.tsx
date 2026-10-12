import Link from "next/link";
import { ArrowRight, Award, Compass, Feather, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About Us | IQ Trousers by Krish Clothing Co.",
  description:
    "Learn about IQ Trousers, our tailoring heritage, fabric standards, and commitment to precision menswear in Ahmedabad.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-neutral-900 text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Heritage & Craftsmanship
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight">
            The Philosophy of IQ Trousers
          </h1>
          <p className="text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Founded by <strong className="text-white font-medium">Krish Clothing Co.</strong> in Ahmedabad, IQ Trousers was born from a singular mission: to engineer the finest pair of trousers a modern gentleman can wear.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-neutral-600 text-sm leading-relaxed">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              Precision Cut. Uncompromising Fabric.
            </h2>
            <p>
              A great pair of trousers is the foundation of any sophisticated wardrobe. Yet all too often, off-the-rack trousers sacrifice comfort for rigidity or compromise fabric longevity for speed.
            </p>
            <p>
              At <strong className="text-neutral-900">IQ Trousers</strong>, every pattern is drafted with geometric precision. From our relaxed <strong className="text-neutral-900">Casual Everyday</strong> chinos and stretch denim to our sharp <strong className="text-neutral-900">Formal Wear</strong> tropical wool dress pants, each piece is engineered to drape cleanly without bunching.
            </p>
            <p>
              We produce an exact spectrum of sizes from <span className="font-semibold text-neutral-900">28 through 44</span> to ensure that every individual finds their custom-tailored proportion.
            </p>
          </div>

          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-100 shadow-xl border border-neutral-200">
            <img
              src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"
              alt="IQ Trousers Tailoring Craft"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 mt-20 border-t border-neutral-100">
          <div className="p-8 bg-neutral-50 rounded-2xl border border-neutral-200">
            <Feather className="w-6 h-6 text-neutral-900 mb-4" />
            <h3 className="font-serif font-bold text-lg text-neutral-900 mb-2">
              Premium Textiles
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              We source natural long-staple cottons, Super 120s Italian wool, and resilient elastane blends that maintain their crease and breathability.
            </p>
          </div>

          <div className="p-8 bg-neutral-50 rounded-2xl border border-neutral-200">
            <Compass className="w-6 h-6 text-neutral-900 mb-4" />
            <h3 className="font-serif font-bold text-lg text-neutral-900 mb-2">
              Ergonomic Tailoring
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Internal waistband grip systems, contoured seat seams, and reinforced stress points ensure ease of movement throughout long working days.
            </p>
          </div>

          <div className="p-8 bg-neutral-50 rounded-2xl border border-neutral-200">
            <Award className="w-6 h-6 text-neutral-900 mb-4" />
            <h3 className="font-serif font-bold text-lg text-neutral-900 mb-2">
              Ethical Production
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Manufactured with fair wages and sustainable textile practices directly out of our headquarters in Ahmedabad, Gujarat.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-20 p-10 bg-neutral-900 text-white rounded-3xl text-center flex flex-col items-center">
          <h3 className="text-2xl font-serif font-bold">Experience the Fit</h3>
          <p className="text-sm text-neutral-300 max-w-md mt-2 mb-6">
            Explore our curated collections or visit our sizing guide to find your ideal trousers.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <span>Shop All Trousers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
