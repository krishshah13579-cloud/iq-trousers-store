import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";
import SortDropdown from "@/components/products/SortDropdown";
import { PackageSearch, Sparkles, Flame, Layers } from "lucide-react";
import Link from "next/link";
import { withDbTimeout } from "@/lib/dbQuery";
import { ALL_FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "@/lib/fallbackData";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    featured?: string;
    tab?: string; // "all" | "new-arrivals" | "discounts"
    color?: string;
    size?: string;
  }>;
}

// Cache products list for 60 seconds with on-demand revalidation
export const revalidate = 60;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const { search, category, sort, minPrice, maxPrice, featured, tab, color, size } = resolvedParams || {};

  // Build Prisma where query - Only show active and in-stock products to customers
  const where: Prisma.ProductWhereInput = {
    active: true,
    stock: { gt: 0 },
  };

  if (search && search.trim() !== "") {
    where.OR = [
      { name: { contains: search.trim() } },
      { description: { contains: search.trim() } },
    ];
  }

  if (category && category.trim() !== "") {
    const cat = category.trim();
    const slugCandidates = [cat];
    if (cat === "casual-everyday" || cat === "everyday-casual") {
      slugCandidates.push("casual-everyday", "everyday-casual");
    }
    if (cat === "formal-wear" || cat === "formal") {
      slugCandidates.push("formal-wear", "formal");
    }

    where.category = {
      OR: [
        ...slugCandidates.map((s) => ({ slug: { equals: s, mode: "insensitive" as const } })),
        { name: { equals: cat, mode: "insensitive" as const } },
        { id: cat },
      ],
    };
  }

  const parsedMin = minPrice ? parseFloat(minPrice) : NaN;
  const parsedMax = maxPrice ? parseFloat(maxPrice) : NaN;
  if (!isNaN(parsedMin) || !isNaN(parsedMax)) {
    where.price = {};
    if (!isNaN(parsedMin)) where.price.gte = parsedMin;
    if (!isNaN(parsedMax)) where.price.lte = parsedMax;
  }

  if (featured === "true") {
    where.featured = true;
  }

  // Determine sort order
  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (sort === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price-desc") {
    orderBy = { price: "desc" };
  } else if (sort === "name") {
    orderBy = { name: "asc" };
  } else if (tab === "new-arrivals") {
    orderBy = { createdAt: "desc" };
  }

  const fallbackResults = [ALL_FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, null] as any;

  const queryPromise = Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: {
          select: { rating: true },
        },
      },
      orderBy,
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
    category
      ? prisma.category.findFirst({
          where: {
            OR: [
              { slug: { equals: category, mode: "insensitive" } },
              { name: { equals: category, mode: "insensitive" } },
              { id: category },
            ],
          },
        })
      : null,
  ]);

  const [rawProducts, rawCategories, selectedCategoryObj] = ((await withDbTimeout(
    queryPromise,
    fallbackResults,
    3000
  )) || fallbackResults) as any;

  const rawProductList = rawProducts && rawProducts.length > 0 ? rawProducts : ALL_FALLBACK_PRODUCTS;

  // Dynamically extract all available colors and sizes across the active catalog
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();

  for (const p of rawProductList as any[]) {
    if (!p) continue;

    // Parse colors
    try {
      const parsed = typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors;
      if (Array.isArray(parsed)) {
        parsed.forEach((c: any) => {
          if (c && typeof c === "string" && c.trim()) colorSet.add(c.trim());
        });
      }
    } catch {
      if (typeof p.colors === "string") {
        p.colors.split(",").forEach((c: string) => {
          if (c.trim()) colorSet.add(c.trim());
        });
      }
    }

    // Parse sizes
    try {
      const parsed = typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes;
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          if (s && (typeof s === "string" || typeof s === "number")) {
            const str = String(s).trim();
            if (str) sizeSet.add(str);
          }
        });
      }
    } catch {
      if (typeof p.sizes === "string") {
        p.sizes.split(",").forEach((s: string) => {
          if (s.trim()) sizeSet.add(s.trim());
        });
      }
    }
  }

  const availableSizes = Array.from(sizeSet).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const availableColors = Array.from(colorSet).sort((a, b) => a.localeCompare(b));
  
  // Filter in-stock items
  let inStockProducts = (rawProductList as any[]).filter(
    (p: any) => p && (p.stock === undefined || p.stock > 0)
  );

  // Filter by Color
  if (color && color.trim() !== "") {
    const targetColor = color.trim().toLowerCase();
    inStockProducts = inStockProducts.filter((p: any) => {
      try {
        const parsedCols = typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors;
        if (Array.isArray(parsedCols)) {
          return parsedCols.some((c: string) => String(c).trim().toLowerCase() === targetColor);
        }
      } catch {}
      if (typeof p.colors === "string") {
        return p.colors.toLowerCase().includes(targetColor);
      }
      return false;
    });
  }

  // Filter by Size
  if (size && size.trim() !== "") {
    const targetSize = size.trim().toLowerCase();
    inStockProducts = inStockProducts.filter((p: any) => {
      try {
        const parsedSz = typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes;
        if (Array.isArray(parsedSz)) {
          return parsedSz.some((s: string) => String(s).trim().toLowerCase() === targetSize);
        }
      } catch {}
      if (typeof p.sizes === "string") {
        return p.sizes.toLowerCase().includes(targetSize);
      }
      return false;
    });
  }

  // Tab Filtering:
  // 1. "discounts": Only show products with discount >= 35%
  // 2. "new-arrivals": Standard catalog ordered with newest first
  if (tab === "discounts") {
    inStockProducts = inStockProducts.filter((p: any) => {
      if (!p.comparePrice || p.comparePrice <= p.price) return false;
      const discountPct = ((p.comparePrice - p.price) / p.comparePrice) * 100;
      return discountPct >= 34.5;
    });
  }

  // Natural sequence sorting helper for product codes (e.g. IMP - 001, IMP - 002, IMP - 010...)
  const getNaturalSortKey = (str: string) => {
    return (str || "").replace(/\d+/g, (n) => n.padStart(6, "0")).toLowerCase();
  };

  // If user has not chosen an explicit custom sort, default to natural sequential order by product name/code
  if (!sort && tab !== "new-arrivals") {
    inStockProducts.sort((a: any, b: any) =>
      getNaturalSortKey(a.name || "").localeCompare(getNaturalSortKey(b.name || ""))
    );
  }

  const products = inStockProducts;
  const categories = rawCategories && rawCategories.length > 0 ? rawCategories : FALLBACK_CATEGORIES;

  // Active Tab Title
  const activeTabTitle =
    tab === "discounts"
      ? "Clearance Offers (≥35% OFF)"
      : tab === "new-arrivals"
      ? "New Arrivals"
      : selectedCategoryObj
      ? selectedCategoryObj.name
      : search
      ? `Search results for "${search}"`
      : "All Products";

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50/70 border-b border-gray-100 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-xs text-gray-500 mb-3 space-x-2">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {activeTabTitle}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight flex items-center gap-3">
                <span>{activeTabTitle}</span>
                {tab === "discounts" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-500 text-white rounded-full shadow-xs">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    Special 35%+ Clearance
                  </span>
                )}
                {tab === "new-arrivals" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white rounded-full shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    Just In
                  </span>
                )}
              </h1>
              {selectedCategoryObj?.description ? (
                <p className="text-sm text-gray-500 mt-2 max-w-xl">
                  {selectedCategoryObj.description}
                </p>
              ) : tab === "discounts" ? (
                <p className="text-sm text-rose-600 font-medium mt-2">
                  Showing exclusive clearance trousers with discounts of 35% and higher. Regular discount is 25%.
                </p>
              ) : tab === "new-arrivals" ? (
                <p className="text-sm text-gray-600 mt-2">
                  Browse our newest trousers freshly synced from stock.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  Showing {products.length} {products.length === 1 ? "product" : "products"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Modern Filter Tab Bar (All Products | New Arrivals | Clearance 35%+ OFF) */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-5 mb-8 overflow-x-auto no-scrollbar">
          <Link
            href={category ? `/products?category=${encodeURIComponent(category)}` : "/products"}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
              !tab || tab === "all"
                ? "bg-gray-950 text-white ring-2 ring-gray-950/20"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Products</span>
          </Link>

          <Link
            href={category ? `/products?tab=new-arrivals&category=${encodeURIComponent(category)}` : "/products?tab=new-arrivals"}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
              tab === "new-arrivals"
                ? "bg-indigo-600 text-white ring-2 ring-indigo-400/40"
                : "bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span>New Arrivals</span>
          </Link>

          <Link
            href={category ? `/products?tab=discounts&category=${encodeURIComponent(category)}` : "/products?tab=discounts"}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
              tab === "discounts"
                ? "bg-rose-600 text-white ring-2 ring-rose-400/40"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Discount Offers (≥35% OFF)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">Sale</span>
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="h-64 animate-pulse bg-gray-50 rounded-xl" />}>
              <ProductFilters
                categories={categories}
                currentCategory={category}
                currentSort={sort}
                currentMinPrice={minPrice}
                currentMaxPrice={maxPrice}
                currentSearch={search}
                availableColors={availableColors}
                availableSizes={availableSizes}
                currentColor={color}
                currentSize={size}
              />
            </Suspense>
          </aside>

          {/* Catalog Listing */}
          <main className="lg:col-span-3">
            {/* Header controls (desktop count & sort) */}
            <div className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
              <span className="text-sm text-gray-500">
                Found <strong className="text-gray-900 font-semibold">{products.length}</strong> {tab === "discounts" ? "clearance items (≥35% OFF)" : "items"}
              </span>
              <Suspense fallback={<div className="w-32 h-8 bg-gray-50 rounded" />}>
                <SortDropdown currentSort={sort} />
              </Suspense>
            </div>

            {/* Product Cards Grid */}
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-xs mb-4">
                  <PackageSearch className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {tab === "discounts" ? "No clearance products with ≥35% discount" : "No products found"}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                  {tab === "discounts"
                    ? "Check back soon for new special clearance deals or view all our products with standard 25% discounts."
                    : "We couldn't find any products matching your filters. Try clearing some filters or searching for something else."}
                </p>
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors shadow-xs"
                >
                  View All Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2.5 xs:gap-3.5 sm:gap-5 md:gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
