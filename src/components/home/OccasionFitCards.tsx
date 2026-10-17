import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const occasions = [
  {
    title: "Boardroom & Executive",
    tag: "FORMAL WEAR",
    subtitle: "Permanent razor creases & pure wool-feel drape for business authority.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
    href: "/products?category=formal-wear",
  },
  {
    title: "Everyday Smart Chinos",
    tag: "EVERYDAY CASUAL",
    subtitle: "High-density stretch twills engineered for seamless desk-to-dinner wear.",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
    href: "/products?category=everyday-casual",
  },
  {
    title: "Winter Flannel & Corduroy",
    tag: "WINTER 2026",
    subtitle: "Heavyweight worsted flannels and ribbed corduroys tailored for warmth.",
    image: "/winter-collection-hero.jpg",
    href: "/products",
  },
  {
    title: "Linen & Resort Travel",
    tag: "WEEKEND LEISURE",
    subtitle: "Airy French linen blends and relaxed drawstring waists for effortless style.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
    href: "/products?category=everyday-casual",
  },
];

export default function OccasionFitCards() {
  return (
    <section className="py-16 sm:py-24 bg-neutral-50/70 border-t border-neutral-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-white text-[#162082] border border-neutral-200/80 mb-3 shadow-2xs">
            CURATED OCCASIONS
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-normal text-[#162082] tracking-tight">
            Shop by Occasion &amp; Fit
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 font-light leading-relaxed">
            Every trouser in our collection is architected with a specific purpose,
            drape, and setting in mind.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {occasions.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group relative flex flex-col justify-end aspect-[3/4] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 p-6 select-none bg-neutral-900"
            >
              {/* Background Image */}
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-95"
              />

              {/* Rich Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Top Tag */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/95 text-gray-900 backdrop-blur-md shadow-xs">
                  {item.tag}
                </span>
              </div>

              {/* Card Content */}
              <div className="relative z-10 text-left space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
                    {item.title}
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center backdrop-blur-md transition-all shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-light line-clamp-2">
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
