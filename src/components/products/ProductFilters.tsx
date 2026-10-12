"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Filter, X, ArrowUpDown, RotateCcw } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface ProductFiltersProps {
  categories: CategoryOption[];
  currentCategory?: string;
  currentSort?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentSearch?: string;
}

export default function ProductFilters({
  categories,
  currentCategory,
  currentSort = "newest",
  currentMinPrice = "",
  currentMaxPrice = "",
  currentSearch = "",
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset pagination if present
    params.delete("page");

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });
    setMobileFiltersOpen(false);
  };

  const handleCategorySelect = (slug: string) => {
    updateFilters({
      category: currentCategory === slug ? undefined : slug,
    });
    setMobileFiltersOpen(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({
      sort: e.target.value,
    });
  };

  const handleClearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => {
      router.push("/products");
    });
    setMobileFiltersOpen(false);
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentMinPrice || currentMaxPrice || currentSearch
  );

  return (
    <div>
      {/* Mobile filter toggle & Sort bar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-gray-900" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={currentSort}
            onChange={handleSortChange}
            aria-label="Sort products by"
            className="text-xs font-medium bg-transparent border-none text-gray-700 focus:outline-none cursor-pointer pr-2"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-gray-900 text-base">Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Categories
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategorySelect("")}
                    className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors ${
                      !currentCategory
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCategorySelect(c.slug)}
                      className={`flex items-center justify-between w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors ${
                        currentCategory === c.slug
                          ? "bg-gray-900 text-white font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{c.name}</span>
                      {c._count?.products !== undefined && (
                        <span
                          className={`text-xs ${
                            currentCategory === c.slug
                              ? "text-gray-300"
                              : "text-gray-400"
                          }`}
                        >
                          {c._count.products}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Price Range
                </h4>
                <form onSubmit={handlePriceSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Min ($)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Max ($)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="500"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Apply Price
                  </button>
                </form>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 py-2 border-t border-gray-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar Filter View */}
      <div className="hidden lg:block space-y-8 sticky top-24">
        {/* Categories Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Categories
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleCategorySelect("")}
                className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-xl transition-all ${
                  !currentCategory
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>All Categories</span>
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => handleCategorySelect(c.slug)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-xl transition-all ${
                    currentCategory === c.slug
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{c.name}</span>
                  {c._count?.products !== undefined && (
                    <span
                      className={`text-xs ${
                        currentCategory === c.slug
                          ? "text-gray-300"
                          : "text-gray-400"
                      }`}
                    >
                      {c._count.products}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Price Range Filter */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Price Filter
          </h3>
          <form onSubmit={handlePriceSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Min ($)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Max ($)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-xs"
            >
              {isPending ? "Updating..." : "Filter Price"}
            </button>
          </form>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
