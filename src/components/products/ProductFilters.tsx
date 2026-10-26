"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Filter, X, ArrowUpDown, RotateCcw, Check } from "lucide-react";
import { getColorHex } from "@/lib/colors";

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
  availableColors?: string[];
  availableSizes?: string[];
  currentColor?: string;
  currentSize?: string;
}

export default function ProductFilters({
  categories,
  currentCategory,
  currentSort = "newest",
  currentMinPrice = "",
  currentMaxPrice = "",
  currentSearch = "",
  availableColors = [],
  availableSizes = [],
  currentColor = "",
  currentSize = "",
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

  const handleSizeSelect = (size: string) => {
    updateFilters({
      size: currentSize === size ? undefined : size,
    });
    setMobileFiltersOpen(false);
  };

  const handleColorSelect = (color: string) => {
    updateFilters({
      color: currentColor === color ? undefined : color,
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("search");
    params.delete("size");
    params.delete("color");
    params.delete("page");
    startTransition(() => {
      router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    });
    setMobileFiltersOpen(false);
  };

  const hasActiveFilters = Boolean(
    currentCategory ||
      currentMinPrice ||
      currentMaxPrice ||
      currentSearch ||
      currentColor ||
      currentSize
  );

  return (
    <div>
      {/* Mobile filter toggle & Sort bar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-xs cursor-pointer"
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
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
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
                    className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
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
                      className={`flex items-center justify-between w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
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

              {/* Sizes Filter (Mobile) */}
              {availableSizes.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Sizes
                    </h4>
                    {currentSize && (
                      <button
                        onClick={() => handleSizeSelect(currentSize)}
                        className="text-[11px] text-gray-500 hover:text-black font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizes.map((sz) => {
                      const isSelected = currentSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleSizeSelect(sz)}
                          className={`min-w-10 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gray-900 text-white shadow-xs scale-105"
                              : "bg-white border border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors Filter (Mobile) */}
              {availableColors.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Colors
                    </h4>
                    {currentColor && (
                      <button
                        onClick={() => handleColorSelect(currentColor)}
                        className="text-[11px] text-gray-500 hover:text-black font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {availableColors.map((col) => {
                      const isSelected = currentColor?.toLowerCase() === col.toLowerCase();
                      const { hex } = getColorHex(col);
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleColorSelect(col)}
                          className={`flex items-center justify-between w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-gray-900 text-white font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="truncate">{col}</span>
                          </div>
                          {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Range (Mobile) */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Price Range
                </h4>
                <form onSubmit={handlePriceSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Min (₹)</label>
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
                      <label className="text-xs text-gray-500 mb-1 block">Max (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="5000"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Apply Price
                  </button>
                </form>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 py-2 border-t border-gray-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar Filter View */}
      <div className="hidden lg:block space-y-6 sticky top-24">
        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Active Filters
              </span>
              <button
                onClick={handleClearAll}
                className="text-[11px] text-gray-500 hover:text-gray-900 font-medium cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-700">
                  <span>Category</span>
                  <button
                    onClick={() => handleCategorySelect(currentCategory)}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentSize && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-700">
                  <span>Size: {currentSize}</span>
                  <button
                    onClick={() => handleSizeSelect(currentSize)}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentColor && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-700">
                  <span>Color: {currentColor}</span>
                  <button
                    onClick={() => handleColorSelect(currentColor)}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-700">
                  <span>
                    ₹{currentMinPrice || "0"} - ₹{currentMaxPrice || "..."}
                  </span>
                  <button
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                      updateFilters({ minPrice: undefined, maxPrice: undefined });
                    }}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Categories Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Categories
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleCategorySelect("")}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-xl transition-all cursor-pointer ${
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
                  className={`flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-xl transition-all cursor-pointer ${
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

        {/* Sizes Filter (Desktop) */}
        {availableSizes.length > 0 && (
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Filter by Size
              </h3>
              {currentSize && (
                <button
                  onClick={() => handleSizeSelect(currentSize)}
                  className="text-[11px] text-gray-500 hover:text-black font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((sz) => {
                const isSelected = currentSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeSelect(sz)}
                    className={`min-w-10 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gray-900 text-white shadow-xs scale-105"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors Filter (Desktop) */}
        {availableColors.length > 0 && (
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Filter by Color
              </h3>
              {currentColor && (
                <button
                  onClick={() => handleColorSelect(currentColor)}
                  className="text-[11px] text-gray-500 hover:text-black font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {availableColors.map((col) => {
                const isSelected = currentColor?.toLowerCase() === col.toLowerCase();
                const { hex } = getColorHex(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleColorSelect(col)}
                    className={`flex items-center justify-between w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="truncate">{col}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price Range Filter (Desktop) */}
        <div className="pt-5 border-t border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Price Filter
          </h3>
          <form onSubmit={handlePriceSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Min (₹)</span>
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
                <span className="text-[11px] text-gray-400 block mb-1">Max (₹)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
            >
              {isPending ? "Updating..." : "Filter Price"}
            </button>
          </form>
        </div>

        {/* Clear Filters (Desktop) */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
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
