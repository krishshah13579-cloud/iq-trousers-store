import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/products/ProductCard";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        featured: true,
        active: true,
      },
      include: {
        category: true,
        reviews: true,
      },
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50/80 to-white pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white shadow-xs text-xs font-medium text-gray-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>IQ Trousers by Krish Clothing Co.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-gray-900 leading-[1.15]">
              Engineered Trousers. <br className="hidden sm:inline" />
              <span className="font-light italic text-gray-700">Unrivaled Proportion.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
              Crafted in Ahmedabad with precision tailoring across sizes 28 through 44. Discover our Casual Everyday and Formal Wear collections.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95"
              >
                <span>Shop All Trousers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/size-guide"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                <span>View Size Guide (28-44)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-gray-100 bg-gray-50/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Free Express Shipping</h4>
                <p className="text-xs text-gray-500 mt-0.5">On all orders over $100</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Secure Checkout</h4>
                <p className="text-xs text-gray-500 mt-0.5">Stripe encrypted payment processing</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">30-Day Easy Returns</h4>
                <p className="text-xs text-gray-500 mt-0.5">Hassle-free guarantee on all items</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Curated Selection
            </span>
            <h2 className="text-3xl font-light text-gray-900 mt-2 tracking-tight">
              Featured <span className="font-medium">Products</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors mt-4 md:mt-0 group"
          >
            <span>View all products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-sm">No featured products currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Collections
            </span>
            <h2 className="text-3xl font-light text-gray-900 mt-2 tracking-tight">
              Shop by <span className="font-medium">Category</span>
            </h2>
            <p className="text-gray-500 text-sm mt-3">
              Browse our diverse categories crafted to fit every aspect of your daily lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200/70 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img
                    src={
                      category.image ||
                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
                    }
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-gray-950/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-medium text-lg leading-snug">{category.name}</h3>
                    <p className="text-xs text-gray-200 mt-0.5 font-light">
                      {category._count.products}{" "}
                      {category._count.products === 1 ? "Product" : "Products"}
                    </p>
                  </div>
                </div>

                {category.description && (
                  <div className="p-4 bg-white">
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Join our community
            </span>
            <h2 className="text-3xl font-light tracking-tight mt-2 text-white">
              Stay in touch with <span className="font-medium">exclusive offers</span>
            </h2>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Subscribe to receive weekly curation updates, limited releases, and private discounts directly in your inbox.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-gray-900 font-medium hover:bg-gray-100 transition-all text-sm w-full md:w-auto text-center"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
