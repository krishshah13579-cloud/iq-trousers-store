import { Sparkles, Shirt, Truck, RotateCcw, ShieldCheck } from "lucide-react";

const valueProps = [
  {
    icon: Sparkles,
    title: "Adaptive Flex Waistband",
    description: "0.5\" concealed micro-stretch for all-day sitting & travel ease.",
  },
  {
    icon: Shirt,
    title: "Premium Long-Staple Fabrics",
    description: "High-twist , linens & Lachako.",
  },
  {
    icon: Truck,
    title: "Pan-India Free Shipping",
    description: "Complimentary express delivery on orders above ₹1,499.",
  },
  {
    icon: RotateCcw,
    title: "7-Day Doorstep Exchanges",
    description: "Try at home risk-free with prompt size swaps.",
  },
  {
    icon: ShieldCheck,
    title: "Mastercrafted in India",
    description: "Tailoring precision & quality by Krish Clothing Co.",
  },
];

export default function BrandValueProps() {
  return (
    <section className="bg-neutral-50/70 border-y border-neutral-200/80 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 items-start">
          {valueProps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`flex flex-col items-center text-center p-3 rounded-2xl transition-all duration-200 hover:bg-white hover:shadow-xs ${
                  index === valueProps.length - 1 ? "col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-[#162082] mb-3 transition-transform group-hover:scale-105">
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1 max-w-[210px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
