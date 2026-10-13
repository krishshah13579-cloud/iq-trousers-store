import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";
import SortDropdown from "@/components/products/SortDropdown";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    featured?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const { search, category, sort, minPrice, maxPrice, featured } = resolvedParams || {};

  // Build Prisma where query
  const where: Prisma.ProductWhereInput = {
    active: true,
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
  }

  // Query products and categories
  let products: any[] = [];
  let categories: any[] = [];
  let selectedCategoryObj: any = null;

  try {
    const results = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: true,
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

    products = results[0];
    categories = results[1];
    selectedCategoryObj = results[2];
  } catch (error) {
    console.error("Failed to query products/categories:", error);
  }

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
              {selectedCategoryObj ? selectedCategoryObj.name : "All Products"}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight">
                {selectedCategoryObj
                  ? selectedCategoryObj.name
                  : search
                  ? `Search results for "${search}"`
                  : "All Products"}
              </h1>
              {selectedCategoryObj?.description ? (
                <p className="text-sm text-gray-500 mt-2 max-w-xl">
                  {selectedCategoryObj.description}
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
              />
            </Suspense>
          </aside>

          {/* Catalog Listing */}
          <main className="lg:col-span-3">
            {/* Header controls (desktop count & sort) */}
            <div className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
              <span className="text-sm text-gray-500">
                Found <strong className="text-gray-900 font-semibold">{products.length}</strong> items
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
                  No products found
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                  We couldn&apos;t find any products matching your filters. Try clearing some filters or searching for something else.
                </p>
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors shadow-xs"
                >
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
